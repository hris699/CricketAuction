const links = require("../common-function/manage-links.json");

const getUserAllowedLinks = async (userType) => {
    let userLinks=links[userType]
    links['public-user'].map(item=>{
        userLinks.push(item)
    })
    const set = new Set(userLinks);

    const uniqueUserLinks = Array.from(set);
   return uniqueUserLinks
  
};

module.exports = {
    getUserAllowedLinks
};
