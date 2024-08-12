const regexForS3ObjectUrl = new RegExp("/^https:\/\/(s3(-[a-z0-9]+)?\.amazonaws\.com\/)?([^\/]+)\/(.+)$/")

module.exports = {regexForS3ObjectUrl}