import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { attendanceAPI, employeeAPI } from '../api/client';

export default function HomeScreen({ navigation }) {
    const { user, logout } = useAuth();
    const [attendance, setAttendance] = useState(null);
    const [schedule, setSchedule] = useState(null);
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            // Fetch today's attendance
            const todayResponse = await attendanceAPI.getStatus();
            setAttendance(todayResponse.data);

            // Fetch this week's schedule
            const scheduleResponse = await employeeAPI.getMySchedule();
            setSchedule(scheduleResponse.data);

            // Fetch monthly stats
            const statsResponse = await employeeAPI.getMonthlyStats();
            setStats(statsResponse.data?.stats);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchData();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const getStatusColor = () => {
        if (!attendance?.hasCheckedIn) return '#EF4444'; // Red - belum absen
        if (attendance?.hasCheckedOut) return '#22C55E'; // Green - sudah selesai
        return '#F59E0B'; // Orange - sudah clock in, belum clock out
    };

    const getStatusText = () => {
        if (!attendance?.hasCheckedIn) return 'Belum Clock In';
        if (attendance?.hasCheckedOut) return 'Sudah Clock Out';
        return 'Sudah Clock In';
    };

    const formatTime = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    const getTodaySchedule = () => {
        if (!schedule?.schedules) return null;
        const today = new Date().toISOString().split('T')[0];
        return schedule.schedules.find(s => s.scheduleDate === today);
    };

    const todaySchedule = getTodaySchedule();

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Memuat data...</Text>
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor="#00D9FF"
                    colors={['#00D9FF']}
                />
            }
        >
            {/* Header with User Info */}
            <View style={styles.header}>
                <View style={styles.userInfo}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                            {user?.fullName?.charAt(0)?.toUpperCase() || '?'}
                        </Text>
                    </View>
                    <View style={styles.userDetails}>
                        <Text style={styles.userName}>{user?.fullName || 'User'}</Text>
                        <Text style={styles.userNip}>NIP: {user?.nip || '-'}</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                    <Text style={styles.logoutText}>Keluar</Text>
                </TouchableOpacity>
            </View>

            {/* Attendance Status Card */}
            <View style={styles.statusCard}>
                <View style={styles.statusHeader}>
                    <Text style={styles.statusTitle}>Status Hari Ini</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
                        <Text style={styles.statusBadgeText}>{getStatusText()}</Text>
                    </View>
                </View>

                <View style={styles.timeContainer}>
                    <View style={styles.timeBox}>
                        <Text style={styles.timeLabel}>Clock In</Text>
                        <Text style={styles.timeValue}>
                            {attendance?.attendance?.checkInTime
                                ? formatTime(attendance.attendance.checkInTime)
                                : '--:--'}
                        </Text>
                    </View>
                    <View style={styles.timeDivider} />
                    <View style={styles.timeBox}>
                        <Text style={styles.timeLabel}>Clock Out</Text>
                        <Text style={styles.timeValue}>
                            {attendance?.attendance?.checkOutTime
                                ? formatTime(attendance.attendance.checkOutTime)
                                : '--:--'}
                        </Text>
                    </View>
                </View>

                {/* Today's Shift */}
                {todaySchedule?.shift && (
                    <View style={styles.shiftInfo}>
                        <Text style={styles.shiftLabel}>Shift: {todaySchedule.shift.name}</Text>
                        <Text style={styles.shiftTime}>
                            {todaySchedule.shift.startTime?.substring(0, 5)} - {todaySchedule.shift.endTime?.substring(0, 5)}
                        </Text>
                    </View>
                )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionContainer}>
                {!attendance?.hasCheckedIn && (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.clockInButton]}
                        onPress={() => navigation.navigate('Attendance', { type: 'clock-in' })}
                    >
                        <Text style={styles.actionIcon}>📍</Text>
                        <Text style={styles.actionButtonText}>Clock In</Text>
                        <Text style={styles.actionSubtext}>Dengan verifikasi wajah & lokasi</Text>
                    </TouchableOpacity>
                )}

                {attendance?.hasCheckedIn && !attendance?.hasCheckedOut && (
                    <TouchableOpacity
                        style={[styles.actionButton, styles.clockOutButton]}
                        onPress={() => navigation.navigate('Attendance', { type: 'clock-out' })}
                    >
                        <Text style={styles.actionIcon}>🏠</Text>
                        <Text style={styles.actionButtonText}>Clock Out</Text>
                        <Text style={styles.actionSubtext}>Dengan verifikasi wajah & lokasi</Text>
                    </TouchableOpacity>
                )}

                {attendance?.hasCheckedOut && (
                    <View style={styles.completedCard}>
                        <Text style={styles.completedIcon}>✅</Text>
                        <Text style={styles.completedTitle}>Absensi Selesai</Text>
                        <Text style={styles.completedSubtext}>
                            Anda sudah menyelesaikan absensi hari ini
                        </Text>
                    </View>
                )}
            </View>

            {/* Monthly Stats */}
            {stats && (
                <View style={styles.statsCard}>
                    <Text style={styles.statsTitle}>Statistik Bulan Ini</Text>
                    <View style={styles.statsGrid}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{stats.hadir || 0}</Text>
                            <Text style={styles.statLabel}>Hadir</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.terlambat || 0}</Text>
                            <Text style={styles.statLabel}>Terlambat</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: '#EF4444' }]}>{stats.absent || 0}</Text>
                            <Text style={styles.statLabel}>Tidak Hadir</Text>
                        </View>
                    </View>
                </View>
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0A4D68',
    },
    contentContainer: {
        padding: 16,
        paddingTop: 60,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0A4D68',
    },
    loadingText: {
        marginTop: 12,
        color: '#94A3B8',
        fontSize: 14,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    userDetails: {
        marginLeft: 12,
    },
    userName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    userNip: {
        fontSize: 14,
        color: '#94A3B8',
    },
    logoutButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    logoutText: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    statusCard: {
        backgroundColor: 'rgba(8, 131, 149, 0.3)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    statusHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    statusTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    statusBadgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    timeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    timeBox: {
        alignItems: 'center',
        flex: 1,
    },
    timeLabel: {
        fontSize: 14,
        color: '#94A3B8',
        marginBottom: 4,
    },
    timeValue: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    timeDivider: {
        width: 1,
        height: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    shiftInfo: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#334155',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    shiftLabel: {
        fontSize: 14,
        color: '#94A3B8',
    },
    shiftTime: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    actionContainer: {
        marginBottom: 16,
    },
    actionButton: {
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
    },
    clockInButton: {
        backgroundColor: '#FFFFFF',
    },
    clockOutButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
    },
    actionIcon: {
        fontSize: 40,
        marginBottom: 8,
    },
    actionButtonText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#0A4D68',
        marginBottom: 4,
    },
    actionSubtext: {
        fontSize: 14,
        color: 'rgba(10, 77, 104, 0.8)',
    },
    completedCard: {
        backgroundColor: 'rgba(8, 131, 149, 0.3)',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    completedIcon: {
        fontSize: 40,
        marginBottom: 8,
    },
    completedTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    completedSubtext: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
    },
    statsCard: {
        backgroundColor: 'rgba(8, 131, 149, 0.3)',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    statsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.7)',
        marginTop: 4,
    },
});
