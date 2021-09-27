module.exports.validateUser = (params) => {
  const checkValidMongoDBId = new RegExp('^[0-9a-fA-F]{24}$');
  const validObjectId = checkValidMongoDBId.test(params);

  if (validObjectId) {
    return { _id: params };
  }
  return { email: params };
};

module.exports.isValidEmail = (email) => {
  const regexEmail = /^[^@]+@[^@]+\.[a-zA-Z]{2,}$/i;
  return (regexEmail.test(email));
};

module.exports.isWeakPassword = (pass) => (pass.length <= 3);

module.exports.isObjectId = (params) => {
  const checkValidMongoDBId = new RegExp('^[0-9a-fA-F]{24}$');
  return checkValidMongoDBId.test(params);
};

module.exports.pagination = (resp, url, page, limit, totalPages) => {
  const headerLink = {
    first: `${url}?limit=${limit}&page=1`,
    prev: resp.hasPrevPage ? `${url}?limit=${limit}&page=${page - 1}` : `${url}?limit=${limit}&page=${page}`,
    next: resp.hasNextPage ? `${url}?limit=${limit}&page=${page + 1}` : `${url}?limit=${limit}&page=${page}`,
    last: `${url}?limit=${limit}&page=${totalPages}`,
  };
  return headerLink;
};
