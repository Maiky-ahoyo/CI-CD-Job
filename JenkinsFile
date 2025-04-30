pipeline {
   agent any
}
environment { VERCEL_TOKEN = credentials('vercel-token') // Configura esta credencial en Jenkins (tipo: Secret Text) }

stages { stage('Checkout') { steps { checkout scm } }

stage('Install Dependencies') {
  steps {
    sh 'npm install'
  }
}

stage('Run Tests') {
  steps {
    script {
      try {
        sh 'npm test'
      } catch (e) {
        currentBuild.result = 'FAILURE'
        error("❌ Tests fallaron. Detalles: ${e}")
      }
    }
  }
}

stage('Build') {
  when {
    expression { currentBuild.result == null || currentBuild.result == 'SUCCESS' }
  }
  steps {
    sh 'npm run build'
  }
}

stage('Validate PR (Preview Build)') {
  when {
    changeRequest()
  }
  steps {
    echo "🔍 Validando Pull Request: ${env.CHANGE_BRANCH} desde ${env.CHANGE_TARGET}"
  }
}

stage('Deploy to Vercel (main only)') {
  when {
    allOf {
      branch 'main'
      not { changeRequest() }
      expression { currentBuild.result == null || currentBuild.result == 'SUCCESS' }
    }
  }
  steps {
    sh 'npm install -g vercel'
    sh 'vercel --prod --token $VERCEL_TOKEN --confirm'
  }
}
}

post { success { slackSend channel: '#deploys', message: "✅ Build exitoso en rama ${env.BRANCH_NAME}: ${env.JOB_NAME} #${env.BUILD_NUMBER}" }


failure {
  mail to: 'gaelborchardt@gmail.com',
    subject: "❌ Build Fallido: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
    body: "La construcción falló en rama ${env.BRANCH_NAME}.\nRevisa: ${env.BUILD_URL}"

  slackSend channel: '#deploys',
    message: "❌ Build fallido en rama ${env.BRANCH_NAME}: ${env.JOB_NAME} #${env.BUILD_NUMBER}\n${env.BUILD_URL}"
}
} }
