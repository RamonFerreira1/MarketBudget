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

## 🚀 Como Hospedar no Vercel (Para Usar no Celular via Web App)

Como este projeto usa o Expo, ele já possui suporte nativo à Web. Isso significa que você pode hospedá-lo no [Vercel](https://vercel.com/) facilmente em 5 minutos!

1.  **Faça Login/Cadastro no Vercel:** Entre em [vercel.com](https://vercel.com/) e faça login usando a sua conta do GitHub.
2.  **Crie um Novo Projeto:** No painel principal (Dashboard) do Vercel, clique no botão **"Add New..."** e escolha **"Project"**.
3.  **Importe o Repositório:** O Vercel mostrará uma lista com os seus repositórios do GitHub. Encontre o repositório `MarketBudget` e clique em **"Import"**.
4.  **Configurações de Build (MUITO IMPORTANTE):**
    *   **Framework Preset:** Deixe como `Other`.
    *   **Build Command:** Substitua o que estiver lá pelo seguinte comando: `npx expo export -p web`
    *   **Output Directory:** Substitua o que estiver lá pela palavra: `dist`
    *   **Install Command:** (Deixe em branco/padrão, o Vercel fará `npm install` sozinho).
5.  **Variáveis de Ambiente (Environment Variables):**
    *   Expanda a seção "Environment Variables" e adicione as suas chaves do Firebase (aquelas que estão no arquivo `.env` do seu PC e não subiram pro GitHub).
    *   Exemplo: Nome: `EXPO_PUBLIC_FIREBASE_API_KEY` | Valor: `AIzaSyCgl...`
6.  **Deploy!** Clique no botão "Deploy" e aguarde cerca de 1 a 2 minutos.

**Pronto!** O Vercel te dará um link público (exemplo: `marketbudget.vercel.app`).
Abra esse link **no navegador do seu celular** e você poderá usar o aplicativo perfeitamente. Em muitos celulares, você pode clicar nas opções do navegador e escolher "Adicionar à Tela Inicial" para que ele fique parecendo um aplicativo nativo instalado!

## 💻 Como Rodar Localmente (Desenvolvimento)

Se desejar rodar o projeto no seu computador:

1.  Clone este repositório:
    ```bash
    git clone https://github.com/RamonFerreira1/MarketBudget.git
    ```
2.  Acesse a pasta do projeto e instale as dependências:
    ```bash
    cd MarketBudget
    npm install
    ```
3.  Crie um arquivo `.env` na raiz do projeto com as credenciais do seu Firebase:
    ```env
    EXPO_PUBLIC_FIREBASE_API_KEY="SuaChaveAqui"
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN="SeuDominioAqui"
    ...
    ```
4.  Inicie o servidor de desenvolvimento do Expo:
    ```bash
    npx expo start
    ```
5.  Pressione `w` no terminal para rodar no navegador, ou baixe o app "Expo Go" no seu celular e escaneie o QR Code.
