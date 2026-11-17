// Map of My Kingdom: small, dependency-free scripts.
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var saveData = navigator.connection && navigator.connection.saveData;

  // Mobile menu
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Silent background clips: stills only for reduced motion or data saver.
  var ambient = document.querySelectorAll(".js-ambient");
  ambient.forEach(function (v) {
    if (reduceMotion || saveData) {
      v.removeAttribute("autoplay");
      v.pause();
      return;
    }
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { v.play().catch(function () {}); } else { v.pause(); }
        });
      }, { threshold: 0.1 }).observe(v);
    }
  });

  // Trailer: plays muted as it scrolls into view; tap for sound.
  var trailer = document.querySelector(".js-trailer");
  var soundBtn = document.querySelector(".js-trailer-sound");
  if (trailer) {
    var userPaused = false; // once a viewer pauses, don't auto-resume on scroll
    if (!reduceMotion && "IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { if (!userPaused) trailer.play().catch(function () {}); } else { trailer.pause(); }
        });
      }, { threshold: 0.35 }).observe(trailer);
    }
    if (soundBtn) {
      soundBtn.addEventListener("click", function () {
        var on = trailer.muted;
        trailer.muted = !on;
        if (on) { trailer.loop = false; trailer.currentTime = 0; }
        userPaused = false;
        trailer.play().catch(function () {});
        soundBtn.setAttribute("aria-pressed", on ? "true" : "false");
        soundBtn.querySelector("span").textContent = on ? "Sound on" : "Tap for sound";
      });
    }

    // Everything that follows playback (captions, countdown, progress bar) runs on one animation loop.
    var box = trailer.closest(".trailer");
    var onFrame = [];
    var raf = 0;
    var frame = function () { onFrame.forEach(function (fn) { fn(); }); };
    var tick = function () { frame(); raf = trailer.paused ? 0 : requestAnimationFrame(tick); };
    trailer.addEventListener("play", function () { if (!raf) raf = requestAnimationFrame(tick); });
    ["pause", "seeked", "progress", "loadedmetadata"].forEach(function (ev) { trailer.addEventListener(ev, frame); });

    // YouTube-style controls: progress bar (click, drag, arrow keys), play/pause, run time.
    var seek = document.querySelector(".js-seek");
    if (seek) {
      box.classList.add("has-controls");
      var fill = seek.querySelector(".js-seek-fill");
      var buffer = seek.querySelector(".js-seek-buffer");
      var knob = seek.querySelector(".js-seek-knob");
      var hoverTip = seek.querySelector(".js-seek-hover");
      var nowEl = document.querySelector(".js-time-now");
      var totalEl = document.querySelector(".js-time-total");
      var playBtn = document.querySelector(".js-trailer-play");
      var FALLBACK_DURATION = 298.6; // known length, shown before the video loads
      var dragging = false;

      var fmt = function (s) {
        s = Math.max(0, Math.floor(s));
        return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2);
      };
      var duration = function () { return isFinite(trailer.duration) && trailer.duration > 0 ? trailer.duration : FALLBACK_DURATION; };
      var showAt = function (t) {
        var p = Math.min(1, Math.max(0, t / duration()));
        fill.style.transform = "scaleX(" + p + ")";
        knob.style.left = (p * 100) + "%";
        nowEl.textContent = fmt(t);
        totalEl.textContent = fmt(duration());
        seek.setAttribute("aria-valuemax", Math.round(duration()));
        seek.setAttribute("aria-valuenow", Math.round(t));
        seek.setAttribute("aria-valuetext", fmt(t) + " of " + fmt(duration()));
      };
      onFrame.push(function () {
        if (!dragging) showAt(trailer.currentTime);
        var b = trailer.buffered, end = 0;
        for (var i = 0; i < b.length; i++) { if (b.start(i) <= trailer.currentTime + 0.5) end = Math.max(end, b.end(i)); }
        buffer.style.transform = "scaleX(" + Math.min(1, end / duration()) + ")";
        box.classList.toggle("is-playing", !trailer.paused);
        playBtn.setAttribute("aria-label", trailer.paused ? "Play trailer" : "Pause trailer");
      });

      var timeAtX = function (x) {
        var r = seek.getBoundingClientRect();
        return Math.min(1, Math.max(0, (x - r.left) / r.width)) * duration();
      };
      var goTo = function (t) { trailer.currentTime = t; showAt(t); frame(); };

      seek.addEventListener("pointerdown", function (e) {
        dragging = true;
        seek.setPointerCapture(e.pointerId);
        box.classList.add("is-scrubbing");
        showAt(timeAtX(e.clientX));
      });
      seek.addEventListener("pointermove", function (e) {
        var t = timeAtX(e.clientX);
        var r = seek.getBoundingClientRect();
        hoverTip.textContent = fmt(t);
        hoverTip.style.left = Math.min(r.width - 24, Math.max(24, e.clientX - r.left)) + "px";
        if (dragging) showAt(t);
      });
      seek.addEventListener("pointerup", function (e) {
        if (!dragging) return;
        dragging = false;
        box.classList.remove("is-scrubbing");
        goTo(timeAtX(e.clientX));
      });
      seek.addEventListener("pointercancel", function () { dragging = false; box.classList.remove("is-scrubbing"); });
      seek.addEventListener("keydown", function (e) {
        var t = trailer.currentTime;
        if (e.key === "ArrowRight" || e.key === "ArrowUp") t += 5;
        else if (e.key === "ArrowLeft" || e.key === "ArrowDown") t -= 5;
        else if (e.key === "Home") t = 0;
        else if (e.key === "End") t = duration() - 0.1;
        else return;
        e.preventDefault();
        goTo(Math.min(duration(), Math.max(0, t)));
      });

      var togglePlay = function () {
        if (trailer.paused) { userPaused = false; trailer.play().catch(function () {}); }
        else { userPaused = true; trailer.pause(); }
      };
      playBtn.addEventListener("click", togglePlay);
      trailer.addEventListener("click", togglePlay); // click the picture, like YouTube
      showAt(0);
    }

    // Opening captions. Times (seconds) come from the trailer: each line shows while its
    // burned-in subtitle is on screen, and words light up across the narrator's speech.
    var lineEl = document.querySelector(".js-trailer-line");
    var countdownEl = document.querySelector(".js-trailer-countdown");
    var INTRO_END = 19.25; // footage starts here
    var CUES = [
      { from: 0.90,  to: 2.35,  parts: [[1.17, 2.30, "We come and we go"]] },
      { from: 2.35,  to: 4.30,  parts: [[2.40, 4.33, "but the land is always here"]] },
      { from: 4.80,  to: 7.60,  parts: [[4.99, 6.26, "And the people who love it"], [6.60, 7.59, "and understand it"]] },
      { from: 7.60,  to: 9.75,  parts: [[7.97, 9.21, "are the people who own it"]] },
      { from: 9.80,  to: 11.55, parts: [[10.16, 10.81, "for a little while"]] },
      { from: 11.90, to: 13.40, parts: [[12.10, 13.30, "It's a tough conversation"]] },
      { from: 13.40, to: 16.25, parts: [[13.40, 15.60, "on how we end our own little while with the land"]] },
      { from: 16.25, to: 19.25, parts: [[16.55, 18.90, "and someone else's little while start"]] }
    ];
    // Split each part's time across its words, weighted by word length.
    CUES.forEach(function (cue) {
      cue.words = [];
      cue.parts.forEach(function (p) {
        var words = p[2].split(" ");
        var total = words.reduce(function (n, w) { return n + w.length + 2; }, 0);
        var t = p[0];
        words.forEach(function (w) {
          var d = (p[1] - p[0]) * (w.length + 2) / total;
          cue.words.push({ text: w, start: t, end: t + d });
          t += d;
        });
      });
    });

    if (lineEl) {
      box.classList.add("has-captions");
      var shown = null, spans = [];
      onFrame.push(function () {
        var t = trailer.currentTime;
        var started = !trailer.paused || t > 0;
        box.classList.toggle("is-intro", started && t < INTRO_END);
        if (countdownEl) countdownEl.textContent = "Video starts in " + Math.max(1, Math.ceil(INTRO_END - t)) + "s";
        var cue = null;
        for (var i = 0; i < CUES.length; i++) { if (t >= CUES[i].from && t < CUES[i].to) { cue = CUES[i]; break; } }
        if (cue !== shown) {
          shown = cue;
          lineEl.classList.remove("is-on");
          lineEl.textContent = "";
          spans = [];
          if (cue) {
            cue.words.forEach(function (w, n) {
              var s = document.createElement("span");
              s.className = "trailer__word";
              s.textContent = w.text;
              lineEl.appendChild(s);
              if (n < cue.words.length - 1) lineEl.appendChild(document.createTextNode(" "));
              spans.push(s);
            });
            void lineEl.offsetWidth; // restart the fade-in
            lineEl.classList.add("is-on");
          }
        }
        if (cue) {
          cue.words.forEach(function (w, n) {
            spans[n].classList.toggle("is-said", t >= w.start);
            spans[n].classList.toggle("is-now", t >= w.start && t < w.end);
          });
        }
      });
    }
  }

  // Clips carousel
  var track = document.querySelector(".js-clips");
  if (track) {
    var slides = track.querySelectorAll(".clip");
    var dotsWrap = document.querySelector(".js-clip-dots");
    var counter = document.querySelector(".js-clip-current");
    var idx = 0;
    var dots = [];
    slides.forEach(function (s, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", "Go to clip " + (i + 1));
      b.addEventListener("click", function () { go(i); });
      dotsWrap.appendChild(b);
      dots.push(b);
    });
    function go(i) {
      idx = (i + slides.length) % slides.length;
      var step = slides[0].getBoundingClientRect().width + 16;
      track.style.transform = "translateX(" + (-idx * step) + "px)";
      slides.forEach(function (s, j) { s.classList.toggle("is-active", j === idx); });
      dots.forEach(function (d, j) {
        d.classList.toggle("is-done", j <= idx);
        if (j === idx) { d.setAttribute("aria-current", "true"); } else { d.removeAttribute("aria-current"); }
      });
      counter.textContent = (idx + 1 < 10 ? "0" : "") + (idx + 1);
    }
    document.querySelector(".js-clip-prev").addEventListener("click", function () { go(idx - 1); });
    document.querySelector(".js-clip-next").addEventListener("click", function () { go(idx + 1); });
    // Swipe on touch screens
    var startX = null;
    track.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener("touchend", function (e) {
      if (startX === null) { return; }
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) { go(idx + (dx < 0 ? 1 : -1)); }
      startX = null;
    });
    window.addEventListener("resize", function () { go(idx); });
    go(0);
  }
  // Clip player
  var player = document.getElementById("player");
  if (player && player.showModal) {
    var pv = player.querySelector("video");
    var pt = player.querySelector(".player__title");
    function closePlayer() { pv.pause(); pv.removeAttribute("src"); pv.load(); if (player.open) { player.close(); } }
    document.querySelectorAll(".js-play").forEach(function (btn) {
      var open = function (e) {
        e.stopPropagation();
        if (trailer) { trailer.pause(); }
        pv.src = btn.getAttribute("data-video");
        pt.textContent = btn.getAttribute("aria-label").replace("Play clip: ", "");
        player.showModal();
        pv.play().catch(function () {});
      };
      btn.addEventListener("click", open);
      var card = btn.closest(".clip");
      if (card) { card.addEventListener("click", function (e) { if (card.classList.contains("is-active")) { open(e); } }); }
    });
    player.querySelector(".js-player-close").addEventListener("click", closePlayer);
    player.addEventListener("close", function () { pv.pause(); });
    player.addEventListener("click", function (e) { if (e.target === player) { closePlayer(); } });
  }
})();
