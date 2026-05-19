# Portal Mercocamp — App Mobile (Android / iOS)

Cópia do portal web (`schedule-front-end`) empacotada com **Capacitor** para
rodar como aplicativo nativo Android e iOS.

## Diferenças em relação ao portal web

- **Backend fixo**: no app nativo não há proxy IIS nem `localhost`. A
  detecção em `src/config/api.js` identifica o ambiente Capacitor
  (`window.Capacitor.isNativePlatform()`) e força o backend de **produção**:
  `https://portal.mercocamptech.com.br/api`.
- O recurso de exportação (serviço externo) fica desabilitado no app a menos
  que `window.EXPORTS_SERVICE_URL` seja configurado em `config.js`.

> Observação CORS: o backend precisa permitir a origem do WebView
> (`https://localhost` / `capacitor://localhost`) para o app consumir a API.

## Pré-requisitos

- Node.js 20+
- Android: JDK 17 + Android SDK (build-tools 34, platform android-34)
- iOS: macOS + Xcode + CocoaPods (build só em Mac)

## Desenvolvimento

```bash
npm install
npm run build          # gera dist/
npx cap sync           # copia dist/ para android/ e ios/
npx cap open android   # abre no Android Studio
npx cap open ios       # abre no Xcode (somente macOS)
```

`npm run mobile:build` faz `build` + `cap sync` de uma vez.

## Gerar APK (Android) localmente

```bash
npm run build
npx cap sync android
cd android
./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```

## Download do APK pelo GitHub (CI)

O workflow [`.github/workflows/build-apk.yml`](.github/workflows/build-apk.yml)
builda o APK e publica numa **GitHub Release** ao criar uma tag `v*`:

```bash
# após commitar/pushar:
git tag v1.16.3
git push origin v1.16.3
```

O Actions gera o APK e anexa `portal-mercocamp-v1.16.3.apk` à Release
correspondente (link estável de download). Também fica disponível como
artifact do workflow (executável via "Run workflow" / workflow_dispatch).

> O APK é **debug não assinado** — instalável via "fontes desconhecidas".
> Para publicar na Play Store é preciso configurar keystore e assinar
> (`assembleRelease` + secrets no Actions).

## iOS

A plataforma iOS está adicionada (`ios/`), porém **sem CI** — o build de
IPA exige macOS + conta Apple Developer. Em um Mac:

```bash
npm run build && npx cap sync ios
cd ios/App && pod install
npx cap open ios   # build/assinatura pelo Xcode
```

## Identificadores

- `appId`: `br.com.mercocamptech.portal`
- `appName`: `Portal Mercocamp`
- Configuração em [`capacitor.config.json`](capacitor.config.json)
