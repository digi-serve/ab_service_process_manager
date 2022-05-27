##
## digiserve/ab-process-manager:develop
##
## This is our microservice for our AppBuilder processes.
##
## Docker Commands:
## ---------------
## $ docker build -t digiserve/ab-process-manager:develop .
## $ docker push digiserve/ab-process-manager:develop
##

FROM digiserve/service-cli:develop

RUN git clone --recursive https://github.com/digi-serve/ab_service_process_manager.git app && cd app && git checkout develop && git submodule update --recursive && npm install cd AppBuilder && npm install

WORKDIR /app

CMD [ "node", "--inspect=0.0.0.0:9229", "app.js" ]
