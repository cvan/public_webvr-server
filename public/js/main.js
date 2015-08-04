(function () {

var state = {
  username: window.location.pathname.split('/')[2]
};

if (state.username) {
  if (state.username[0] === '~') {
    state.username = state.username.substr(1);
  }

  document.title = state.username + ' | ' + document.title;
}


function onkey(e) {
  console.log('onkey', e);

  if (e.key === 'f' || e.key === 'c' || e.key === 'n' || e.key == 'u') {
    window.location.href = 'https://github.com/cvan/public_webvr/';
  } else {
    console.log('post message key', e);
    iframe.contentWindow.postMessage({
      event: {
        keyCode: e.keyCode,
        charCode: e.charCode
      }
    }, '*');
  }
}

document.body.addEventListener('keyup', function (e) {
  console.log('keyup', e);
  if (e.alt || e.ctrlKey || e.metaKey) {
    return;
  }

  onkey(e);
});

window.addEventListener('message', function (e) {
  if (typeof e.data === 'object') {
    console.log('got keypress from iframe window');
    onkey(e.data.event);
  }
});

})();
