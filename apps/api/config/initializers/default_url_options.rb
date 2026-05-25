# Set default URL options for Active Storage blob URLs
# Override host in production via environment variables
Rails.application.routes.default_url_options = {
  host: ENV.fetch('HOST', '100.113.246.44'),
  port: ENV.fetch('PORT', '3001')
}
