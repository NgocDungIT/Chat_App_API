const getGoogleUserProfile = async (identityData) => {
    const url = await fetch(
        `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${identityData.access_token}`,
        {
            headers: {
                Authorization: `${identityData.token_type} ${identityData.access_token}`,
                'Content-Type': 'application/json',
            },
        }
    );
    const data = await url.json();
    return data;
};

module.exports = { getGoogleUserProfile };
