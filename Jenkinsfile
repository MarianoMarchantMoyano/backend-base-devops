pipeline {
    
    agent {
        docker {
            image 'node:16-alpine' // Usa una imagen de Docker con Node.js y npm preinstalados
            args '-v /var/run/docker.sock:/var/run/docker.sock' // Monta el socket de Docker para la etapa de build
        }
    }
    
    environment {
        SONAR_HOST_URL = 'http://localhost:8084'
        SONAR_TOKEN = 'token-sonar-devops'
        NEXUS_URL = 'http://localhost:8081'
        NEXUS_REPO = 'docker-hosted'  // Actualiza con el nombre de tu repositorio en Nexus
        DOCKER_IMAGE = 'backend-base-devops:latest'  // Cambia por el nombre de tu imagen
        NEXUS_CREDENTIALS_ID = 'nexus-key'  // Debes configurar las credenciales en Jenkins
        KUBERNETES_DEPLOYMENT = 'backend-app'  // Nombre del deployment definido en el kubernetes.yaml
        KUBERNETES_NAMESPACE = 'default'  // Namespace donde está desplegada la aplicación
    }

    stages {
        stage('Install Dependencies') {
            steps {
                sh 'npm install'  // Ajusta según tu gestor de dependencias
            }
        }

        stage('Run Tests') {
            steps {
                sh 'npm test'  // Cambia este comando si utilizas otro framework de testing
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'  // Ajusta según tu script de build
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') { // El nombre debe coincidir con la configuración en Jenkins
                    sh 'npm run sonar'
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 1, unit: 'HOURS') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    def appVersion = sh(script: "cat package.json | jq -r .version", returnStdout: true).trim()
                    docker.build("${DOCKER_IMAGE}:${appVersion}")
                }
            }
        }

        stage('Push Docker Image to Nexus') {
            steps {
                script {
                    docker.withRegistry("${NEXUS_URL}/${NEXUS_REPO}", "${NEXUS_CREDENTIALS_ID}") {
                        def appVersion = sh(script: "cat package.json | jq -r .version", returnStdout: true).trim()
                        docker.image("${DOCKER_IMAGE}:${appVersion}").push()
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                script {
                    def appVersion = sh(script: "cat package.json | jq -r .version", returnStdout: true).trim()
                    sh """
                    kubectl set image deployment/${KUBERNETES_DEPLOYMENT} \
                    ${KUBERNETES_DEPLOYMENT}=${DOCKER_IMAGE}:${appVersion} \
                    --namespace=${KUBERNETES_NAMESPACE}
                    kubectl rollout status deployment/${KUBERNETES_DEPLOYMENT} --namespace=${KUBERNETES_NAMESPACE}
                    """
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}
