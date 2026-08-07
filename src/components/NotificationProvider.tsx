import React, { createContext, useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import EventSource from 'react-native-sse';
import { getStoredUser } from '../services/authApi';
import { API_BASE_URL, storage, TOKEN_KEY } from '../services/api';
import { Bell, X } from 'lucide-react-native';

interface NotificationContextType {
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType>({ unreadCount: 0 });

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(-100))[0];

  useEffect(() => {
    let es: EventSource | null = null;

    const setupSSE = async () => {
      const user = await getStoredUser();
      if (!user) return;

      const url = `${API_BASE_URL}/api/v1/notifications/stream?user_id=${user.userId}`;
      const token = await storage.getItem(TOKEN_KEY);
      
      es = new EventSource(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      es.addEventListener('message', (event) => {
        if (event.data) {
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.message) {
              showToast(parsed.message);
              setUnreadCount((prev) => prev + 1);
            }
          } catch (e) {
            console.error('Failed to parse SSE data', e);
          }
        }
      });

      es.addEventListener('error', (err) => {
        console.warn('SSE Error:', err);
      });
    };

    setupSSE();

    return () => {
      if (es) {
        es.close();
      }
    };
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 20, // push down into safe area
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      hideToast();
    }, 4000);
  };

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setToastMessage(null);
    });
  };

  return (
    <NotificationContext.Provider value={{ unreadCount }}>
      {children}
      
      {/* Global Toast Overlay */}
      <Animated.View
        style={[
          styles.toastContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
        pointerEvents={toastMessage ? 'auto' : 'none'}
      >
        <View style={styles.toastContent}>
          <View style={styles.iconCircle}>
            <Bell size={18} color="#3b82f6" />
          </View>
          <Text style={styles.toastText} numberOfLines={2}>
            {toastMessage}
          </Text>
          <TouchableOpacity onPress={hideToast} style={styles.closeBtn}>
            <X size={16} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </NotificationContext.Provider>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  toastContent: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  toastText: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '500',
  },
  closeBtn: {
    padding: 8,
  },
});
