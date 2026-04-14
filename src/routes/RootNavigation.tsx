import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

/**
 * Função para navegar para uma rota específica.
 * @param name - O nome da rota para a qual navegar.
 * @param params - (Opcional) Parâmetros para passar para a rota.
 */

export function navigate(name: string, params?: object) {

  console.log(`ROOT NAVIGATION: Tentando navegar para: ${name}`);

  if (navigationRef.isReady()) {
    console.log("ROOT NAVIGATION: Ref está PRONTA. Executando navegação.");
    navigationRef.navigate(name, params);
  } else {
    console.warn('ROOT NAVIGATION: FALHA! Ref NÃO ESTÁ PRONTA.');
  }
}