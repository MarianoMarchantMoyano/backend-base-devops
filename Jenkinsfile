pipeline {
    agent any

    environment {
        DOCKER_IMAGE_NAME = 'my-app'
        NEXUS_URL = 'http://nexus.example.com'
        KUBECONFIG = '/path/to/kubeconfig'
        SONARQUBE_URL = 'http://sonarqube.example.com'
        SONARQUBE_TOKEN = credentials('token-sonar-devops') // Asegúrate de definir esta credencial en Jenkins
        PROJECT_KEY = 'my-project'
    }

    stages {
        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Testing') {
            steps {
                sh 'npm test'
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Upload SonarQube Report') {
            steps {
                sh 'npm run sonar'
            }
        }

        stage('Quality Gate Validation') {
            steps {
                script {
                    def result = sh(script: '''
                    curl -u ${SONARQUBE_TOKEN}: \
                    "${SONARQUBE_URL}/api/qualitygates/project_status?projectKey=${PROJECT_KEY}" | \
                    jq '.projectStatus.status == "OK"' | \
                    grep true
                    ''', returnStatus: true)
                    
                    if (result != 0) {
                        error 'Quality gate failed'
                    }
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                sh 'docker build -t ${DOCKER_IMAGE_NAME}:latest .'
            }
        }

        stage('Upload Docker Image to Nexus') {
            steps {
                sh '''
                docker tag ${DOCKER_IMAGE_NAME}:latest ${NEXUS_URL}/repository/docker-repo/${DOCKER_IMAGE_NAME}:latest
                docker push ${NEXUS_URL}/repository/docker-repo/${DOCKER_IMAGE_NAME}:latest
                '''
            }
        }

        stage('Update Kubernetes Deployment') {
            steps {
                sh '''
                kubectl --kubeconfig=${KUBECONFIG} set image deployment/my-deployment my-container=${NEXUS_URL}/repository/docker-repo/${DOCKER_IMAGE_NAME}:latest
                '''
            }
        }
    }

    post {
        always {
            // Actions that should always be performed (e.g., clean up)
            cleanWs()
        }
    }
}
