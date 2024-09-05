pipeline {
    agent any

    environment {
        PATH = "${env.PATH}:/usr/local/bin" // Ajusta esta ruta según sea necesario
    }

    stages {
        // ... (resto de tu pipeline)
    }

    post {
        always {
            script {
                cleanWs()
            }
        }
    }
}
