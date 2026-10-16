# Site de imobiliária com painel

Site completo para imobiliária ou corretor: vitrine de imóveis com várias fotos por imóvel, busca com filtros, agendamento de visita, captação de imóveis ("Anuncie") e um painel para o cliente cuidar de tudo sozinho.

Feito em Node 22, **sem dependências** (banco `node:sqlite`, servidor `node:http`). As páginas são montadas no servidor, o que é bom para o Google e rápido no celular.

> A marca "Lumiar Imóveis", os textos e os 8 imóveis são **exemplos**. As fotos são do Unsplash (licença livre). No painel, um botão apaga todos os exemplos.

## O que tem

**Site**
- Abertura cinematográfica: no computador, a rolagem conduz uma "caminhada" para dentro da casa (fachada, sala, varanda) com frases grandes. No celular, as cenas se alternam sozinhas. Com movimento reduzido ou sem JavaScript, fica uma foto parada com o título.
- Busca (comprar/alugar, tipo, cidade, faixa de valor) e listagem com filtros, ordenação e paginação. O endereço da página guarda os filtros, então dá para compartilhar uma busca.
- Ficha do imóvel: mosaico de fotos, visor em tela cheia (setas, teclado, arrastar no celular, miniaturas), medidas, características, vídeo do YouTube, mapa (só carrega quando clicado), simulador de financiamento (SAC), imóveis parecidos, barra fixa no celular.
- WhatsApp com mensagem pronta citando o código do imóvel; formulários de contato, visita e "anunciar" com validação, máscara de telefone e proteção contra robôs.
- Favoritos guardados no aparelho.
- Selects, caixas de seleção, barra de rolagem, autopreenchimento, foco e pop-ups com o visual do site. Nenhum `alert`/`confirm` nativo.
- Google: título e descrição por página, `canonical`, Open Graph (prévia bonita no WhatsApp), dados estruturados (`RealEstateAgent`, `RealEstateListing`, `BreadcrumbList`, `ItemList`), `sitemap.xml` e `robots.txt`.
- LGPD: consentimento nos formulários, política de privacidade, e Analytics/Pixel só carregam depois que o visitante aceita o aviso de cookies.

**Painel (`/painel`)**
- Início com contatos novos, imóveis sem foto, último backup e lista do que falta para o site ficar completo.
- Imóveis: cadastro completo, ligar/desligar "no site" e "destaque", busca.
- Fotos: arrastar várias de uma vez (também do celular). O navegador reduz para 2000 px em WebP antes de enviar. Dá para reordenar arrastando ou pelas setas, escolher a capa e escrever legenda.
- Contatos: filtrados por situação, botão "Responder" que abre o WhatsApp com mensagem pronta, exportar planilha.
- Site: nome, CRECI, contatos, redes, as 3 cenas da abertura (frase e foto), "Quem somos", Google Analytics, Search Console e Pixel da Meta.
- Conta: trocar senha, backup manual, baixar backups, ver a chave de recuperação.

## Rodar localmente

```bash
npm start            # http://localhost:8080
npm test             # testes de ponta a ponta
npm run check        # confere a sintaxe de todos os arquivos
```

No primeiro início, o log mostra o **código de instalação**. Abra `/painel` e use esse código para criar a conta do administrador.

## Variáveis de ambiente

| Variável | Para quê |
|---|---|
| `PORT` | Porta (padrão 8080). |
| `DATA_DIR` | Pasta do banco, das fotos e dos backups (padrão `./dados`). |
| `SITE_URL` | Endereço oficial, ex.: `https://www.imobiliaria.com.br`. **Defina em produção** (usado no canonical, no sitemap e nas prévias). |
| `SETUP_CODE` | Fixa o código do primeiro acesso, em vez de sortear um. |
| `COOKIE_SEGURO=1` | Força cookie `Secure` quando o HTTPS termina antes do app e o cabeçalho `X-Forwarded-Proto` não chega. |
| `BACKUP_S3_ENDPOINT`, `BACKUP_S3_BUCKET`, `BACKUP_S3_CHAVE_ID`, `BACKUP_S3_SEGREDO`, `BACKUP_S3_REGIAO`, `BACKUP_S3_PREFIXO` | Cópia do backup fora do servidor (Cloudflare R2, Backblaze B2...). |
| `LEADS_WEBHOOK_URL` (+ `LEADS_WEBHOOK_SEGREDO`) | Cada contato novo é enviado por POST para esta URL (ex.: n8n, que avisa no WhatsApp). Com segredo, vai assinado no cabeçalho `X-Assinatura` (HMAC SHA-256). |
| `SEM_EXEMPLOS=1` | Não cria os imóveis de exemplo num banco vazio. |

## Backup e restauração

- Todo dia o app faz um backup do banco **e das fotos**: confere a integridade, compacta, criptografa (AES-256-GCM) e confere se o arquivo abre. Guarda 7 diários, 4 semanais e 6 mensais em `dados/backup/arquivos`.
- Com as variáveis `BACKUP_S3_*`, envia uma cópia para fora do servidor. **Configure antes de colocar no ar.**
- A chave fica em `dados/backup/backup.key`. Guarde uma cópia fora do servidor (o painel mostra em Conta, Chave de recuperação).
- Para restaurar (nunca sobrescreve):
  ```bash
  node restaurar.js site-backup-AAAAMMDD-HHMMSS.sitebak --chave <CHAVE> --destino ./restaurado
  ```
  Depois de conferir, pare o app e copie `site.db` e `uploads/` para a pasta de dados.

## Segurança

- Senha com scrypt e sal; sessão em cookie `HttpOnly`, `SameSite=Strict`, `__Host-`/`Secure` em HTTPS. No banco fica só o hash do token.
- Limite de tentativas no login, no primeiro acesso, na troca de senha e nos formulários.
- Rotas do painel exigem o cabeçalho `X-Painel` e a mesma origem (contra CSRF).
- CSP restritiva (só scripts do próprio site, mais Google/Meta quando configurados), `X-Frame-Options`, `nosniff` e HSTS.
- Tudo o que vem do usuário é escapado no HTML. A planilha exportada neutraliza fórmulas.
- Fotos: só WebP/JPEG/PNG conferidos pelos primeiros bytes, com nome aleatório. Arquivos estáticos não saem da pasta pública.

## No ar (VPS Hostinger)

Endereço: **https://imobiliaria.arcanestudios.io**. Roda na VPS como o projeto Docker `imobiliaria`, criado a partir de `deploy/vps/imobiliaria.compose.yml`. Atrás do Traefik, só aceita tráfego vindo da Cloudflare.

- **Atualização automática:** a cada 90 s ele confere a `main`. Quando chega commit novo, ele baixa o código e roda `npm test`. Se os testes falharem, nada muda no ar. Se passarem, ele copia os dados (volume `imobiliaria_copias`, 5 últimas cópias), troca a versão e confere `/saude`. Se a versão nova não responder, volta sozinho para a anterior.
- **Dados:** volume `imobiliaria_dados` (banco, fotos e backups diários criptografados).
- **DNS:** registro `imobiliaria` na Cloudflare apontando para o IP da VPS, com o **proxy ligado** (nuvem laranja).
- **Variáveis do projeto** (no painel da Hostinger, nunca no git): `BACKUP_S3_*` para a cópia fora do servidor e `LEADS_WEBHOOK_URL` para o n8n.
- **Primeiro acesso:** o código de instalação aparece nos logs do projeto.

Espaço: cada foto grande tem de 250 a 500 KB. Um site com 100 imóveis e 25 fotos cada passa de 1 GB. Se crescer, mova as fotos para o Cloudflare R2.
