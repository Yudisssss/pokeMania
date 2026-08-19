import { useEffect, useRef, useState } from 'react'
import { Camera, LoaderCircle, ScanLine, X } from 'lucide-react'
import styles from './CameraPreview.module.css'

type CameraStatus = 'idle' | 'requesting' | 'active' | 'error'

function stopMediaStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop())
}

function getCameraErrorMessage(error: unknown) {
  if (!(error instanceof DOMException)) {
    return 'Não foi possível acessar a câmera.'
  }

  switch (error.name) {
    case 'NotAllowedError':
      return 'A permissão da câmera foi negada.'
    case 'NotFoundError':
      return 'Nenhuma câmera foi encontrada.'
    case 'NotReadableError':
      return 'A câmera está sendo utilizada por outro aplicativo.'
    case 'OverconstrainedError':
      return 'A câmera não suporta a configuração solicitada.'
    default:
      return 'Ocorreu um erro ao acessar a câmera.'
  }
}

export function CameraPreview() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mountedRef = useRef(true)

  const [status, setStatus] = useState<CameraStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    mountedRef.current = true

    return () => {
      mountedRef.current = false
      stopMediaStream(streamRef.current)
      streamRef.current = null
    }
  }, [])

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('error')
      setErrorMessage('Este navegador não oferece suporte à câmera.')
      return
    }

    setStatus('requesting')
    setErrorMessage(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      })

      if (!mountedRef.current) {
        stopMediaStream(stream)
        return
      }

      streamRef.current = stream

      const videoElement = videoRef.current

      if (!videoElement) {
        throw new Error('Elemento de vídeo não encontrado.')
      }

      videoElement.srcObject = stream
      await videoElement.play()

      setStatus('active')
    } catch (error) {
      console.error('Falha ao iniciar a câmera:', error)

      stopMediaStream(streamRef.current)
      streamRef.current = null

      if (videoRef.current) {
        videoRef.current.srcObject = null
      }

      if (mountedRef.current) {
        setStatus('error')
        setErrorMessage(getCameraErrorMessage(error))
      }
    }
  }

  function stopCamera() {
    stopMediaStream(streamRef.current)
    streamRef.current = null

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setStatus('idle')
    setErrorMessage(null)
  }

  const isRequesting = status === 'requesting'
  const isActive = status === 'active'

  const statusMessage = errorMessage
    ? 'Câmera indisponível'
    : isRequesting
      ? 'Solicitando permissão'
      : isActive
        ? 'Câmera pronta'
        : 'Câmera desligada'

  return (
    <main className={styles.page}>
      <section
        className={styles.scannerShell}
        aria-labelledby="scanner-title"
      >
        <header className={styles.topBar}>
          <div className={styles.brandMark} aria-hidden="true">
            dM
          </div>

          <div className={styles.titleGroup}>
            <span>dexMania</span>
            <h1 id="scanner-title">Escanear carta</h1>
          </div>

          <div className={styles.headerIcon} aria-hidden="true">
            <ScanLine size={22} strokeWidth={2.25} />
          </div>
        </header>

        <div className={styles.cameraStage}>
          <video
            ref={videoRef}
            className={styles.video}
            autoPlay
            muted
            playsInline
            aria-label="Prévia da câmera"
          />

          <div className={styles.videoShade} aria-hidden="true" />

          <div className={styles.instructions}>
            <h2>Centralize sua carta</h2>
            <p>Alinhe os quatro cantos e evite reflexos.</p>
          </div>

          <div className={styles.cardGuide} aria-hidden="true">
    

            <span className={`${styles.corner} ${styles.topLeft}`} />
            <span className={`${styles.corner} ${styles.topRight}`} />
            <span className={`${styles.corner} ${styles.bottomLeft}`} />
            <span className={`${styles.corner} ${styles.bottomRight}`} />

            {isActive && <span className={styles.scanLine} />}
          </div>

          {errorMessage && (
            <p className={styles.errorMessage} role="alert">
              {errorMessage}
            </p>
          )}

          <div className={styles.controls}>
            <div className={styles.statusPill} aria-live="polite">
              <span
                className={`${styles.statusDot} ${
                  isActive ? styles.statusDotActive : ''
                }`}
              />

              {statusMessage}
            </div>

            <button
              className={styles.cameraButton}
              type="button"
              onClick={isActive ? stopCamera : startCamera}
              disabled={isRequesting}
              aria-label={isActive ? 'Fechar câmera' : 'Abrir câmera'}
            >
              {isRequesting ? (
                <LoaderCircle
                  className={styles.spinner}
                  size={30}
                  aria-hidden="true"
                />
              ) : isActive ? (
                <X size={30} aria-hidden="true" />
              ) : (
                <Camera size={30} aria-hidden="true" />
              )}
            </button>

            <span className={styles.actionLabel}>
            </span>
          </div>
        </div>
      </section>
    </main>
  )
}