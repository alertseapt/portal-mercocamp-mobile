// ===================================================
// GERADOR DE INFORMAÇÕES DE BUILD
// ===================================================

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function generateBuildInfo() {
  try {
    console.log('🔄 Gerando informações de build...')

    // Ler package.json para obter versão
    const packagePath = path.join(__dirname, 'package.json')
    const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
    const version = packageData.version || '0.5.0'

    // Gerar hash baseado no timestamp e conteúdo dos arquivos principais
    const timestamp = Date.now()
    const hashSource = `${version}-${timestamp}`
    const buildHash = crypto
      .createHash('md5')
      .update(hashSource)
      .digest('hex')
      .substring(0, 8)

    const buildInfo = {
      version,
      buildHash,
      timestamp: new Date().toISOString(),
      buildTime: timestamp,
      environment: process.env.NODE_ENV || 'development',
    }

    // Salvar informações de build em src/ e public/
    const buildInfoPath = path.join(__dirname, 'src', 'build-info.json')
    const publicBuildInfoPath = path.join(
      __dirname,
      'public',
      'build-info.json'
    )

    const buildInfoJson = JSON.stringify(buildInfo, null, 2)
    fs.writeFileSync(buildInfoPath, buildInfoJson)
    fs.writeFileSync(publicBuildInfoPath, buildInfoJson)

    console.log('✅ Informações de build geradas:')
    console.log(`   Versão: ${buildInfo.version}`)
    console.log(`   Build Hash: ${buildInfo.buildHash}`)
    console.log(`   Timestamp: ${buildInfo.timestamp}`)
    console.log(`   Arquivo salvo: ${buildInfoPath}`)
    console.log(`   Arquivo público salvo: ${publicBuildInfoPath}`)

    return buildInfo
  } catch (error) {
    console.error('❌ Erro ao gerar informações de build:', error)

    // Criar informações padrão em caso de erro
    const fallbackInfo = {
      version: '0.5.0',
      buildHash: 'dev-' + Date.now().toString().substring(-6),
      timestamp: new Date().toISOString(),
      buildTime: Date.now(),
      environment: 'development',
    }

    try {
      const buildInfoPath = path.join(__dirname, 'src', 'build-info.json')
      const publicBuildInfoPath = path.join(
        __dirname,
        'public',
        'build-info.json'
      )
      const fallbackJson = JSON.stringify(fallbackInfo, null, 2)
      fs.writeFileSync(buildInfoPath, fallbackJson)
      fs.writeFileSync(publicBuildInfoPath, fallbackJson)
    } catch (writeError) {
      console.error('❌ Erro ao salvar informações de fallback:', writeError)
    }

    return fallbackInfo
  }
}

// Executar se chamado diretamente
generateBuildInfo()

export default generateBuildInfo
