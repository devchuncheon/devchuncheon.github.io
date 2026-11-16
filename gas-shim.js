/* 걸어서 춘천 — 구글 화면 기능 대신하기 (2026-11-16)
 * 화면 코드가 쓰던 google.script.run / google.script.history 를 그대로 두고,
 * 실제로는 요청 창구(Apps Script doPost)와 브라우저 기록으로 처리합니다.
 * 창구 주소는 config.js 의 WALK_CONFIG.api 하나뿐입니다. */
(function () {
  var CFG = window.WALK_CONFIG || {};

  /* 관리자 개인 주소(?adm=)로 첫 화면에 들어오면 관리자 화면으로 보냄 */
  if (/[?&]adm=/.test(location.search) && !/admin\.html$/.test(location.pathname)) {
    location.replace('admin.html' + location.search);
    return;
  }

  function post(fn, args, ok, fail) {
    var ctl = ('AbortController' in window) ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, 40000);
    fetch(CFG.api, { method: 'POST', body: JSON.stringify({ fn: fn, args: args }), signal: ctl ? ctl.signal : undefined })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        clearTimeout(timer);
        if (res && res.ok) { if (ok) ok(res.v); }
        else if (fail) fail(new Error((res && res.message) || '요청을 처리하지 못했습니다.'));
      })
      .catch(function (e) { clearTimeout(timer); if (fail) fail(e); });
  }

  function runner(ok, fail) {
    var target = {
      withSuccessHandler: function (f) { return runner(f, fail); },
      withFailureHandler: function (f) { return runner(ok, f); }
    };
    return new Proxy(target, {
      get: function (t, name) {
        if (name in t) return t[name];
        return function () { post(String(name), Array.prototype.slice.call(arguments), ok, fail); };
      }
    });
  }

  /* 크롬은 사람이 화면을 누르기 전에 만든 '뒤로' 칸을 건너뜁니다.
   * 그래서 화면을 누를 때마다 화면 코드의 setTrap()을 한 번 더 불러 덫을 다시 놓습니다. */
  function rearm() { try { if (typeof window.setTrap === 'function') window.setTrap(); } catch (e) {} }
  document.addEventListener('pointerdown', rearm, true);
  document.addEventListener('touchstart', rearm, true);

  window.google = window.google || {};
  window.google.script = {
    run: runner(null, null),
    history: {
      push: function (state) { history.pushState(state || {}, ''); },
      replace: function (state) { history.replaceState(state || {}, ''); },
      setChangeHandler: function (fn) {
        window.addEventListener('popstate', function (e) { fn({ state: e.state }); });
      }
    }
  };

  /* 앱처럼 열기 보조 파일 */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
})();
