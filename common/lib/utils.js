module.exports.getUsername = function (username) {
  if (username[0] === '~') {
    return username.substr(1);
  }

  return username;
};
