export class GeolocationService {
  constructor() {
    this.watchId = null
    this.currentPosition = null
  }

  /**
   * Aktuelle Position einmal abrufen
   */

  async getCurrentPosition(options = {}) {
    const defaultOptions = {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 0,
    }

    const finalOptions = { ...defaultOptions, ...options }

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation wird nicht unterstützt'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentPosition = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          }
          resolve(this.currentPosition)
        },
        (error) => {
          reject(this.handleGeolocationError(error))
        },
        finalOptions,
      )
    })
  }

  /**
   * Position kontinuierlich überwachen
   */

  watchPosition(callback, errorCallback, options = {}) {
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 1000,
    }

    const finalOptions = { ...defaultOptions, ...options }

    if (!navigator.geolocation) {
      errorCallback(new Error('Geolocation wird nicht unterstützt'))
      return
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.currentPosition = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        }
        callback(this.currentPosition)
      },
      (error) => {
        errorCallback(this.handleGeolocationError(error))
      },
      finalOptions,
    )
    return this.watchId
  }

  /**
   * Position-Überwachung stoppen
   */
  clearWatch() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId)
      this.watchId = null
    }
  }
  /**
   * Geolocation Fehler behandeln
   */
  handleGeolocationError(error) {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return new Error('Zugriff auf Standort wurde verweigert')
      case error.POSITION_UNAVAILABLE:
        return new Error('Standort ist nicht verfügbar')
      case error.TIMEOUT:
        return new Error('Zeitüberschreitung bei Standortabfrage')
      default:
        return new Error('Unbekannter Fehler bei Standortabfrage')
    }
  }

  /**
   * Prüfen ob Geolocation verfügbar ist
   */
  isSupported() {
    return 'geolocation' in navigator
  }

  /**
   * Berechtigung für Geolocation abfragen
   */
  async checkPermissions() {
    if (!navigator.permissions) {
      return 'unsupported'
    }

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' })
      return permission.state
    } catch (error) {
      return 'unknown'
    }
  }
}

export const geolocationService = new GeolocationService()
