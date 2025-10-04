exports.handler = async (event, context) => {
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            message: 'Test function working!',
            event: {
                httpMethod: event.httpMethod,
                path: event.path,
                queryStringParameters: event.queryStringParameters
            }
        })
    };
};
