// ==UserScript==
// @include http://www.google.com/url?*
// @include https://www.google.com/url?*
// @include http://www.google.co.jp/url?*
// @include https://www.google.co.jp/url?*
// ==/UserScript==
location.replace(
  decodeURIComponent(
    (location.search.match(/[?&]url=([^&]+)/) ||
      location.search.match(/[?&]q=([^&]+)/))[1]
  )
);
