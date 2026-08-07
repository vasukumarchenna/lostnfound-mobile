import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ViewStyle,
  TouchableWithoutFeedback,
  Keyboard,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

type KeyboardWrapperType = 'scrollable' | 'fixed-bottom' | 'modal';

interface KeyboardWrapperProps {
  children: React.ReactNode;
  type?: KeyboardWrapperType;
  style?: ViewStyle | ViewStyle[];
  contentContainerStyle?: ViewStyle | ViewStyle[];
  offset?: number;
}

export const KeyboardWrapper: React.FC<KeyboardWrapperProps> = ({
  children,
  type = 'scrollable',
  style,
  contentContainerStyle,
  offset = Platform.OS === 'ios' ? 90 : 0,
}) => {
  if (type === 'scrollable') {
    return (
      <KeyboardAwareScrollView
        style={[styles.container, style]}
        contentContainerStyle={contentContainerStyle}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        keyboardOpeningTime={0}
        extraScrollHeight={20}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </KeyboardAwareScrollView>
    );
  }

  if (type === 'modal') {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, style]}
        keyboardVerticalOffset={offset}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.container}>{children}</View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    );
  }

  // 'fixed-bottom' type for chats/comments
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, style]}
      keyboardVerticalOffset={offset}
    >
      {children}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
