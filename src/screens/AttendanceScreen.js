import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { attendanceAPI } from '../api/client';

export default function AttendanceScreen({ route, navigation }) {
    const { type } = route.params; // 'clock-in' or 'clock-out'
    const isClockIn = type === 'clock-in';

    const [cameraPermission, requestCameraPermission] = useCameraPermissions();
    const [locationPermission, setLocationPermission] = useState(null);
    const [location, setLocation] = useState(null);
    const [isCapturing, setIsCapturing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [step, setStep] = useState('permission'); // permission, location, camera, submitting, result
    const [error, setError] = useState(null);
    const [result, setResult] = useState(null);

    const cameraRef = useRef(null);

    useEffect(() => {
        checkPermissions();
    }, []);

    const checkPermissions = async () => {
        try {
            // Check location permission
            const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
            setLocationPermission(locationStatus === 'granted');

            if (locationStatus !== 'granted') {
                setError('Izin lokasi diperlukan untuk absensi');
                return;
            }

            // Get location immediately
            setStep('location');
            await getLocation();

        } catch (err) {
            console.error('Permission error:', err);
            setError('Gagal mendapatkan izin: ' + err.message);
        }
    };

    const getLocation = async () => {
        try {
            const loc = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });
            setLocation(loc.coords);
            setStep('camera');
        } catch (err) {
            console.error('Location error:', err);
            setError('Gagal mendapatkan lokasi: ' + err.message);
        }
    };

    const handleCapture = async () => {
        if (!cameraRef.current || isCapturing) return;

        try {
            setIsCapturing(true);

            const photo = await cameraRef.current.takePictureAsync({
                quality: 0.7,
                base64: false,
                exif: false,
            });

            await submitAttendance(photo);
        } catch (err) {
            console.error('Capture error:', err);
            setError('Gagal mengambil foto: ' + err.message);
            setIsCapturing(false);
        }
    };

    const submitAttendance = async (photo) => {
        try {
            setStep('submitting');
            setIsSubmitting(true);

            // Create form data
            const formData = new FormData();
            formData.append('latitude', location.latitude.toString());
            formData.append('longitude', location.longitude.toString());

            // Add face image
            const imageUri = photo.uri;
            const filename = imageUri.split('/').pop();
            const match = /\.(\w+)$/.exec(filename);
            const fileType = match ? `image/${match[1]}` : 'image/jpeg';

            formData.append('faceImage', {
                uri: imageUri,
                name: filename || 'face.jpg',
                type: fileType,
            });

            // Call appropriate API
            const response = isClockIn
                ? await attendanceAPI.clockIn(formData)
                : await attendanceAPI.clockOut(formData);

            setResult({
                success: true,
                message: response.data?.message || (isClockIn ? 'Clock in berhasil!' : 'Clock out berhasil!'),
                data: response.data,
            });
            setStep('result');

        } catch (err) {
            console.error('Submit error:', err);
            const errorMessage = err.response?.data?.error || 'Terjadi kesalahan saat mengirim absensi';
            setResult({
                success: false,
                message: errorMessage,
            });
            setStep('result');
        } finally {
            setIsSubmitting(false);
            setIsCapturing(false);
        }
    };

    const handleRetry = () => {
        setError(null);
        setResult(null);
        setStep('permission');
        checkPermissions();
    };

    const handleDone = () => {
        navigation.goBack();
    };

    // Permission check screen
    if (!cameraPermission?.granted && step === 'camera') {
        return (
            <View style={styles.container}>
                <View style={styles.centerContent}>
                    <Text style={styles.icon}>📷</Text>
                    <Text style={styles.title}>Izin Kamera Diperlukan</Text>
                    <Text style={styles.subtitle}>
                        Untuk verifikasi wajah, aplikasi memerlukan akses ke kamera
                    </Text>
                    <TouchableOpacity style={styles.button} onPress={requestCameraPermission}>
                        <Text style={styles.buttonText}>Izinkan Kamera</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // Error screen
    if (error) {
        return (
            <View style={styles.container}>
                <View style={styles.centerContent}>
                    <Text style={styles.icon}>❌</Text>
                    <Text style={styles.title}>Terjadi Kesalahan</Text>
                    <Text style={styles.subtitle}>{error}</Text>
                    <TouchableOpacity style={styles.button} onPress={handleRetry}>
                        <Text style={styles.buttonText}>Coba Lagi</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryButton} onPress={handleDone}>
                        <Text style={styles.secondaryButtonText}>Kembali</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // Location loading screen
    if (step === 'location') {
        return (
            <View style={styles.container}>
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color="#FFFFFF" />
                    <Text style={styles.title}>Mendapatkan Lokasi...</Text>
                    <Text style={styles.subtitle}>
                        Pastikan GPS aktif untuk absensi
                    </Text>
                </View>
            </View>
        );
    }

    // Submitting screen
    if (step === 'submitting') {
        return (
            <View style={styles.container}>
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color="#FFFFFF" />
                    <Text style={styles.title}>Memproses Absensi...</Text>
                    <Text style={styles.subtitle}>
                        Mohon tunggu, sedang verifikasi wajah dan lokasi
                    </Text>
                </View>
            </View>
        );
    }

    // Result screen
    if (step === 'result') {
        return (
            <View style={styles.container}>
                <View style={styles.centerContent}>
                    <Text style={styles.icon}>{result?.success ? '✅' : '❌'}</Text>
                    <Text style={[styles.title, { color: result?.success ? '#FFFFFF' : '#FF6B6B' }]}>
                        {result?.success ? 'Berhasil!' : 'Gagal'}
                    </Text>
                    <Text style={styles.subtitle}>{result?.message}</Text>

                    {result?.success && result?.data?.shiftInfo && (
                        <View style={styles.infoCard}>
                            <Text style={styles.infoLabel}>Shift:</Text>
                            <Text style={styles.infoValue}>
                                {result.data.shiftInfo.startTime?.substring(0, 5)} - {result.data.shiftInfo.endTime?.substring(0, 5)}
                            </Text>
                        </View>
                    )}

                    {result?.data?.faceVerified && (
                        <View style={styles.verifiedBadge}>
                            <Text style={styles.verifiedText}>✓ Wajah Terverifikasi</Text>
                        </View>
                    )}

                    <TouchableOpacity style={styles.button} onPress={handleDone}>
                        <Text style={styles.buttonText}>Kembali ke Beranda</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // Camera screen
    return (
        <View style={styles.container}>
            <View style={styles.cameraHeader}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backButtonText}>← Kembali</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {isClockIn ? 'Clock In' : 'Clock Out'}
                </Text>
                <View style={{ width: 80 }} />
            </View>

            <View style={styles.cameraContainer}>
                <CameraView
                    ref={cameraRef}
                    style={styles.camera}
                    facing="front"
                >
                    <View style={styles.overlay}>
                        <View style={styles.faceGuide}>
                            <View style={styles.faceFrame} />
                        </View>
                        <Text style={styles.instructionText}>
                            Posisikan wajah Anda di dalam bingkai
                        </Text>
                    </View>
                </CameraView>
            </View>

            {/* Location info */}
            {location && (
                <View style={styles.locationInfo}>
                    <Text style={styles.locationIcon}>📍</Text>
                    <Text style={styles.locationText}>
                        Lokasi: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </Text>
                </View>
            )}

            {/* Capture button */}
            <View style={styles.captureContainer}>
                <TouchableOpacity
                    style={[
                        styles.captureButton,
                        isCapturing && styles.captureButtonDisabled,
                        isClockIn ? styles.captureButtonGreen : styles.captureButtonOrange
                    ]}
                    onPress={handleCapture}
                    disabled={isCapturing}
                >
                    {isCapturing ? (
                        <ActivityIndicator color="#FFFFFF" size="large" />
                    ) : (
                        <>
                            <Text style={styles.captureIcon}>📸</Text>
                            <Text style={styles.captureText}>
                                {isClockIn ? 'Clock In' : 'Clock Out'}
                            </Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A4D68',
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    icon: {
        fontSize: 64,
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#94A3B8',
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 24,
    },
    button: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
        marginBottom: 12,
    },
    buttonText: {
        color: '#0A4D68',
        fontSize: 16,
        fontWeight: '600',
    },
    secondaryButton: {
        paddingHorizontal: 32,
        paddingVertical: 16,
        width: '100%',
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#94A3B8',
        fontSize: 16,
        fontWeight: '600',
    },
    cameraHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 16,
        backgroundColor: '#0A4D68',
    },
    backButton: {
        width: 80,
    },
    backButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
    },
    headerTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
    cameraContainer: {
        flex: 1,
        overflow: 'hidden',
        borderRadius: 16,
        marginHorizontal: 16,
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    faceGuide: {
        width: 250,
        height: 320,
        justifyContent: 'center',
        alignItems: 'center',
    },
    faceFrame: {
        width: 220,
        height: 280,
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.6)',
        borderRadius: 140,
        backgroundColor: 'transparent',
    },
    instructionText: {
        color: '#FFFFFF',
        fontSize: 16,
        textAlign: 'center',
        marginTop: 16,
        paddingHorizontal: 40,
        textShadowColor: 'rgba(0, 0, 0, 0.8)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    locationInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        backgroundColor: 'rgba(8, 131, 149, 0.3)',
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    locationIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    locationText: {
        color: '#94A3B8',
        fontSize: 12,
    },
    captureContainer: {
        padding: 24,
        alignItems: 'center',
    },
    captureButton: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    captureButtonGreen: {
        backgroundColor: '#FFFFFF',
    },
    captureButtonOrange: {
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
    },
    captureButtonDisabled: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    captureIcon: {
        fontSize: 32,
        marginBottom: 4,
    },
    captureText: {
        color: '#0A4D68',
        fontSize: 14,
        fontWeight: '700',
    },
    infoCard: {
        backgroundColor: 'rgba(8, 131, 149, 0.3)',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    infoLabel: {
        color: '#94A3B8',
        fontSize: 14,
        marginRight: 8,
    },
    infoValue: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    verifiedBadge: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 24,
    },
    verifiedText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
});
