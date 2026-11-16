// 홈 화면 아이콘(앱처럼 열기)을 위한 보조 파일. 저장(캐시)은 하지 않음.
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', function () {});
