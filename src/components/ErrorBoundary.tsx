import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text } from 'react-native';

import { supabase } from '../lib/supabase';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ERRO Pego pelo Error Boundary:", error.message);

    try {
      const { error: logError } = await supabase.from('app_errors').insert({
        error_message: error.message,
        component_stack: errorInfo.componentStack,
      });

      if (logError) {
        console.error("Falha ao logar erro no Supabase:", logError.message);
      }
    } catch (e) {
      console.error("Exceção ao logar erro:", e);
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, color: 'red', textAlign: 'center' }}>
            Ops! Algo deu errado nesta tela.
          </Text>
          <Text style={{ marginVertical: 10, textAlign: 'center' }}>
            O erro foi: {this.state.error?.message}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;