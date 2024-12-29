# Use an official PHP runtime as a parent image
FROM php:8.2-fpm

# Set working directory
WORKDIR /var/www/html

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
    zip \
    unzip

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring gd

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy project files
COPY . /var/www/html

# Install Laravel dependencies
RUN composer install

# Set file permissions
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Create startup script directly in Dockerfile (simpler approach)
RUN echo '#!/bin/sh\nphp artisan reverb:serve & php-fpm' > /usr/local/bin/startup.sh \
    && chmod 755 /usr/local/bin/startup.sh

# Expose port 9000 and start both services
EXPOSE 9000
CMD ["/usr/local/bin/startup.sh"]

