'use strict';
// Imóveis de EXEMPLO para a demonstração. Ficam marcados (exemplo = 1) e somem com um clique no painel.
// Fotos: Unsplash (licença livre), guardadas em /exemplo.

const EXEMPLOS = [
  {
    k: 'a', titulo: 'Casa contemporânea com piscina e pátio gramado', tipo: 'casa', finalidade: 'venda', preco: 1490000, iptu: 3200,
    area_util: 286, area_total: 520, quartos: 4, suites: 2, banheiros: 4, vagas: 3, bairro: 'Jardim das Acácias', cidade: 'Santa Rosa', uf: 'RS', destaque: 1, financiamento: 1,
    resumo: 'Linhas retas, muita luz natural e uma piscina que vira o centro da casa nos fins de semana.',
    descricao: 'Projeto de arquiteto, pensado para quem gosta de receber. A sala integrada abre por inteiro para o pátio e a piscina, com pé direito alto e esquadrias de piso ao teto.\n\nCozinha em ilha com bancada em quartzo, despensa e lavanderia separada. No andar de cima ficam os quatro dormitórios, sendo duas suítes, todas com sacada voltada para o nascer do sol.\n\nTerreno de esquina, todo murado, com portão eletrônico e espaço para horta.',
    caracteristicas: ['Piscina', 'Área gourmet', 'Churrasqueira', 'Jardim', 'Sacada', 'Ar-condicionado', 'Energia solar', 'Portão eletrônico'],
    legendas: ['Fachada e piscina', 'Cozinha com ilha', 'Sala integrada', 'Suíte principal', 'Banheiro da suíte'],
  },
  {
    k: 'b', titulo: 'Casa clássica com jardim florido perto do centro', tipo: 'casa', finalidade: 'venda', preco: 690000, iptu: 1400,
    area_util: 168, area_total: 360, quartos: 3, suites: 1, banheiros: 2, vagas: 2, bairro: 'Centro', cidade: 'Santa Rosa', uf: 'RS', destaque: 1, financiamento: 1, permuta: 1,
    resumo: 'Aquela casa de vó, toda reformada: piso de madeira, janelas grandes e jardim na frente.',
    descricao: 'Casa de esquina com fachada clássica e jardim de entrada. Reformada em 2023: telhado novo, parte elétrica e hidráulica refeitas.\n\nSala de jantar com janelas para o jardim, cozinha ampla com fogão a lenha e área de serviço coberta. Três dormitórios, sendo uma suíte com closet.\n\nA duas quadras da praça central, mercado e escola.',
    caracteristicas: ['Jardim', 'Varanda', 'Lareira', 'Churrasqueira', 'Lavanderia', 'Aceita pet'],
    legendas: ['Fachada', 'Sala de jantar', 'Cozinha', 'Dormitório', 'Banheiro'],
  },
  {
    k: 'c', titulo: 'Apartamento claro com sacada e vista para a praça', tipo: 'apartamento', finalidade: 'aluguel', preco: 2300, condominio: 420, iptu: 90,
    area_util: 82, quartos: 2, suites: 1, banheiros: 2, vagas: 1, bairro: 'Centro', cidade: 'Ijuí', uf: 'RS', destaque: 1,
    resumo: 'Dois dormitórios, sala ampla e sacada de frente para a praça. Pronto para morar.',
    descricao: 'Apartamento em prédio com elevador e portaria, no coração do centro. Sol da manhã na sala e nos quartos.\n\nCozinha planejada, banheiro social e suíte com box de vidro. Uma vaga de garagem coberta.\n\nCondomínio inclui água e limpeza das áreas comuns.',
    caracteristicas: ['Sacada', 'Elevador', 'Portaria 24h', 'Semimobiliado', 'Ar-condicionado'],
    legendas: ['Sala de estar', 'Sala de jantar', 'Cozinha', 'Suíte', 'Dormitório'],
  },
  {
    k: 'd', titulo: 'Casa moderna em condomínio fechado', tipo: 'casa', finalidade: 'venda', preco: 980000, condominio: 380, iptu: 2100,
    area_util: 198, area_total: 400, quartos: 3, suites: 3, banheiros: 4, vagas: 2, bairro: 'Reserva do Bosque', cidade: 'Ijuí', uf: 'RS', financiamento: 1,
    resumo: 'Três suítes, garagem para dois carros e segurança de condomínio com área verde.',
    descricao: 'Casa térrea em condomínio com portaria e ruas arborizadas. Planta inteligente: área social de um lado, íntima do outro.\n\nSala de estar e jantar integradas à cozinha, escritório e três suítes. Acabamento em porcelanato e esquadrias de alumínio preto.\n\nCondomínio com salão de festas, playground e trilha de caminhada.',
    caracteristicas: ['Portaria 24h', 'Salão de festas', 'Playground', 'Escritório', 'Closet', 'Câmeras'],
    legendas: ['Fachada', 'Sala de estar', 'Sala de jantar', 'Suíte', 'Banheiro'],
  },
  {
    k: 'e', titulo: 'Sobrado com varanda e pátio para a família toda', tipo: 'sobrado', finalidade: 'venda', preco: 820000, iptu: 1700,
    area_util: 230, area_total: 450, quartos: 4, suites: 1, banheiros: 3, vagas: 2, bairro: 'Bela Vista', cidade: 'Três de Maio', uf: 'RS', destaque: 1, financiamento: 1,
    resumo: 'Varanda que abraça a casa, pátio enorme e espaço de sobra para as crianças.',
    descricao: 'Sobrado com varanda em L, perfeito para o chimarrão no fim da tarde. Pátio gramado com árvores frutíferas.\n\nTérreo com sala de estar, sala de TV, cozinha e lavabo. Em cima, quatro dormitórios, sendo uma suíte.\n\nGaragem para dois carros e depósito.',
    caracteristicas: ['Varanda', 'Pátio', 'Pomar', 'Churrasqueira', 'Lareira', 'Aceita pet'],
    legendas: ['Fachada com varanda', 'Varanda', 'Sala de estar', 'Sala de TV', 'Dormitório'],
  },
  {
    k: 'f', titulo: 'Chácara com casa sede, açude e pomar', tipo: 'chacara', finalidade: 'venda', preco: 760000,
    area_util: 160, area_total: 20000, quartos: 3, suites: 1, banheiros: 2, vagas: 4, bairro: 'Linha Bonita', cidade: 'Três de Maio', uf: 'RS',
    resumo: 'Dois hectares a 8 km da cidade, com casa sede pronta, galpão e água de poço.',
    descricao: 'Chácara de dois hectares com acesso por estrada de chão conservada. Casa sede de alvenaria com lareira e varandão.\n\nGalpão para máquinas, açude com peixes, pomar formado e poço artesiano. Luz trifásica.\n\nIdeal para morar ou para fim de semana.',
    caracteristicas: ['Poço artesiano', 'Pomar', 'Lareira', 'Varanda', 'Churrasqueira', 'Vista panorâmica'],
    legendas: ['Casa sede', 'Sala de jantar', 'Sala de estar', 'Dormitório', 'Canto de leitura'],
  },
  {
    k: 'g', titulo: 'Casa alto padrão com piscina de borda e vista', tipo: 'casa', finalidade: 'venda', preco: 2350000, iptu: 4800,
    area_util: 410, area_total: 800, quartos: 4, suites: 4, banheiros: 6, vagas: 4, bairro: 'Alto da Colina', cidade: 'Santa Rosa', uf: 'RS', destaque: 1, permuta: 1,
    resumo: 'Projeto autoral com vidro do chão ao teto, piscina aquecida e vista livre para o vale.',
    descricao: 'Uma das casas mais especiais da região. Fachada em concreto e madeira, com a piscina de borda voltada para o pôr do sol.\n\nEscada escultural, living com pé direito duplo e adega climatizada. Quatro suítes com closet, a principal com banheira.\n\nAutomação de iluminação, energia solar e aquecimento de piso.',
    caracteristicas: ['Piscina', 'Vista panorâmica', 'Área gourmet', 'Energia solar', 'Aquecimento a gás', 'Closet', 'Câmeras', 'Portão eletrônico'],
    legendas: ['Fachada e piscina', 'Escada e living', 'Sala de estar', 'Detalhe da fachada', 'Estar íntimo'],
  },
  {
    k: 'h', titulo: 'Casa de praia de rio com piscina para temporada longa', tipo: 'casa', finalidade: 'aluguel', preco: 4200, iptu: 0,
    area_util: 180, area_total: 600, quartos: 3, suites: 2, banheiros: 3, vagas: 3, bairro: 'Prainha', cidade: 'Ijuí', uf: 'RS',
    resumo: 'Mobiliada, com piscina e deck. Aluguel mensal para quem quer morar perto da natureza.',
    descricao: 'Casa mobiliada com piscina, deck de madeira e área gourmet coberta. A cinco minutos da prainha do rio.\n\nTrês dormitórios, dois com suíte. Cozinha completa e lavanderia.\n\nAceita contrato de 12 meses com seguro fiança.',
    caracteristicas: ['Piscina', 'Mobiliado', 'Área gourmet', 'Churrasqueira', 'Aceita pet'],
    legendas: ['Fachada e piscina', 'Fachada lateral', 'Sala de jantar', 'Suíte', 'Banheiro'],
  },
];

function semear(imoveis, db) {
  if (db.prepare('SELECT 1 FROM imoveis LIMIT 1').get()) return 0;
  let n = 0;
  EXEMPLOS.forEach((e, idx) => {
    const { k, legendas, ...dados } = e;
    const criado = new Date(Date.now() - (EXEMPLOS.length - idx) * 864e5 * 3).toISOString();
    const im = imoveis.criar(dados, { exemplo: true, criado_em: criado });
    legendas.forEach((legenda, i) => imoveis.adicionarFoto(im.id, { grande: `/exemplo/${k}${i + 1}.webp`, pequena: `/exemplo/${k}${i + 1}-p.webp`, legenda }));
    n++;
  });
  return n;
}

module.exports = { semear, EXEMPLOS };
