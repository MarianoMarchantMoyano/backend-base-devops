pipeline {
    agent any

    stages {
        stage('Check Docker') {
            steps {
                script {
                    sh 'docker --version'
                }
            }
        }
    }
}

