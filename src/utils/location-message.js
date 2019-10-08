const generateLocationMessage=(latitude,longitude,username) =>{
    return {
        url:`https://google.com/maps?${latitude},${longitude}`,
        createdAt:new Date().getTime(),
        username
    }
};

module.exports = {
    generateLocationMessage
};
