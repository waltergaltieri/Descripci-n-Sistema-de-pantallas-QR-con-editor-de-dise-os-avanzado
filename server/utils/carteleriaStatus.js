const getProductVisibility = (status = 'active') => {
  if (status === 'paused') {
    return {
      visible: false,
      showSoldOutBadge: false
    };
  }

  if (status === 'sold_out') {
    return {
      visible: true,
      showSoldOutBadge: true
    };
  }

  return {
    visible: true,
    showSoldOutBadge: false
  };
};

module.exports = {
  getProductVisibility
};
