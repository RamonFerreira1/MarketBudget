# 🛒 MarketBudget

O **MarketBudget** é um aplicativo móvel (e web) desenvolvido com React Native (Expo) projetado para ajudar os usuários a controlarem seus gastos durante as compras no supermercado. Ele permite definir um orçamento antes de sair de casa e, ao longo das compras, registrar o valor real de cada produto colocado no carrinho. Além disso, o aplicativo conta com um sistema inteligente que registra um histórico de compras e avisa o usuário se o preço de um item subir em comparação com compras passadas.

## ✨ Funcionalidades Principais

*   **Definição de Orçamento:** Antes de ir ao mercado, defina qual é o limite de gastos (R$) para aquela sessão.
*   **Lista Pré-Mercado:** Adicione itens à sua lista e planeje quantidades antes mesmo de chegar ao mercado.
*   **Modo Mercado (Carrinho):** Registre os itens à medida que os coloca no carrinho, inserindo o preço real de prateleira. O aplicativo mostrará o gasto acumulado e quanto resta do orçamento.
*   **Alertas Visuais:** Barras de progresso dinâmicas (verde, amarelo e vermelho) alertam o momento exato em que os gastos se aproximam do limite do orçamento.
*   **Histórico e Variação de Preço:** O aplicativo salva o preço que você pagou por cada produto e, em compras futuras, mostra de imediato se aquele mesmo produto ficou **mais caro (vermelho)** ou **mais barato (verde)** em relação à sua última ida ao mercado.
*   **Acompanhamento de Histórico:** Veja todas as suas compras concluídas na aba "Histórico" e analise sua evolução de preços para os mesmos produtos. Você também pode apagar registros antigos ou limpar todos os testes com um único botão.

## 🛠️ Tecnologias Utilizadas

*   **[React Native (Expo)](https://expo.dev/)**: Framework utilizado para o desenvolvimento multiplataforma (Android, iOS e Web).
*   **[Zustand](https://github.com/pmndrs/zustand)**: Gerenciamento leve e global do estado das compras (carrinho, orçamento e produtos).
*   **[AsyncStorage](https://react-native-async-storage.github.io/async-storage/)**: Persistência de dados locais, salvando o histórico das suas compras no seu dispositivo sem precisar de contas online para o uso básico.
*   **TypeScript**: Adicionando tipagem estática para aumentar a segurança e reduzir bugs durante o desenvolvimento.
