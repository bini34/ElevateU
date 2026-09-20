# Use an official PHP runtime as a parent image
FROM php:8.2.33-fpm-bookworm@sha256:babbe39d11a6c79895a3155953de5415bd450bab4fa74869e8f786110f359546

# Set working directory
WORKDIR /var/www/html

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
    zip \
    unzip \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions (pcntl is required by the Reverb websocket server)
RUN docker-php-ext-install pdo_mysql mbstring gd pcntl

# PHP upload limits for post/message media
COPY docker/php/uploads.ini /usr/local/etc/php/conf.d/uploads.ini

# Install Composer
COPY --from=composer:2.10.3@sha256:a5f59b9fd2faf31218632be4809dc6491761085e8064c31dc3b84378c48c248b /usr/bin/composer /usr/bin/composer

# Copy project files (.dockerignore keeps .env, vendor and uploads out)
COPY . /var/www/html

# Install Laravel dependencies (dev deps excluded from the image). Compose
# bind-mounts the source tree, so install host vendor dependencies before up.
# Scripts are skipped during install because there is no .env at build
# time; package discovery then runs with safe drivers.
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts \
    && mkdir -p storage/framework/cache/data storage/framework/sessions \
                storage/framework/views storage/framework/testing storage/logs \
    && BROADCAST_CONNECTION=log CACHE_STORE=array SESSION_DRIVER=array QUEUE_CONNECTION=sync \
       php artisan package:discover --ansi

# Set file permissions
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Supervisor runs php-fpm, the Reverb websocket server and the queue worker
COPY supervisord.conf /etc/supervisor/conf.d/app.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# 9000 = php-fpm (nginx upstream), 6001 = Reverb websockets
EXPOSE 9000 6001
CMD ["/usr/local/bin/entrypoint.sh"]
