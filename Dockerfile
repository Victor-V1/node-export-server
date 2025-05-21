FROM --platform=linux/amd64 public.ecr.aws/lambda/nodejs:18


COPY ./package.json ./package-lock.json ./

RUN rm -rf root/.cache/puppeteer

RUN yum install -y \
        fontconfig \
        freetype \
        git \
        bzip2 \
        atk \
        at-spi2-atk \
        cups-libs \
        libdrm \
        libXcomposite \
        libXdamage \
        libXrandr \
        mesa-libgbm \
        pango \
        && yum clean all \
        && rm -rf /var/cache/yum

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

RUN npm install --only=prod

COPY . ${LAMBDA_TASK_ROOT}

CMD [ "index.handler" ]