const validationInput = (data) => {
    for (let key in data) {
        if (data[key] === undefined || data[key] === null || data[key] === '') {
            return key;
        }
    }
    return null;
};

module.exports = {validationInput}
