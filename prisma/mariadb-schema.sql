-- MariaDB schema for TicketFlow (português)

DROP DATABASE IF EXISTS ticketflow;
CREATE DATABASE ticketflow
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE ticketflow;

CREATE TABLE departamento (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(191) NOT NULL,
  descricao TEXT NULL,
  cor VARCHAR(50) NOT NULL DEFAULT '#3B82F6',
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE agente (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(191) NOT NULL,
  email VARCHAR(191) NOT NULL UNIQUE,
  senha_hash VARCHAR(191) NOT NULL,
  papel ENUM('ADMIN','SUPERVISOR','ATENDENTE') NOT NULL DEFAULT 'ATENDENTE',
  avatar VARCHAR(191) NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  pontos_totais INT NOT NULL DEFAULT 0,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  id_departamento INT NULL,
  INDEX idx_agente_id_departamento (id_departamento),
  CONSTRAINT fk_agente_departamento FOREIGN KEY (id_departamento) REFERENCES departamento(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE politica_sla (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(191) NOT NULL,
  prioridade ENUM('BAIXA','MEDIA','ALTA','URGENTE') NOT NULL,
  minutos_primeira_resposta INT NOT NULL,
  minutos_resolucao INT NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  id_departamento INT NULL,
  INDEX idx_politica_sla_id_departamento (id_departamento),
  CONSTRAINT fk_politica_sla_departamento FOREIGN KEY (id_departamento) REFERENCES departamento(id) ON DELETE SET NULL,
  UNIQUE KEY uq_politica_sla_departamento_prioridade (id_departamento, prioridade)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE chamado (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  numero_chamado INT NOT NULL UNIQUE,
  assunto VARCHAR(255) NOT NULL,
  descricao TEXT NOT NULL,
  status ENUM('ABERTO','PENDENTE','EM_ANDAMENTO','RESOLVIDO','FECHADO') NOT NULL DEFAULT 'ABERTO',
  prioridade ENUM('BAIXA','MEDIA','ALTA','URGENTE') NOT NULL DEFAULT 'MEDIA',
  origem ENUM('WHATSAPP','WEB','EMAIL','TELEFONE') NOT NULL DEFAULT 'WHATSAPP',
  status_sla ENUM('NO_PRAZO','EM_RISCO','ESTOURADO','CUMPRIDO') NOT NULL DEFAULT 'NO_PRAZO',
  nome_solicitante VARCHAR(191) NOT NULL,
  telefone_solicitante VARCHAR(50) NULL,
  email_solicitante VARCHAR(191) NULL,
  primeira_resposta_em DATETIME NULL,
  resolvido_em DATETIME NULL,
  fechado_em DATETIME NULL,
  sla_vencimento_em DATETIME NULL,
  primeira_resposta_vencimento_em DATETIME NULL,
  id_chat_whatsapp VARCHAR(191) NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  id_departamento INT NULL,
  id_agente_responsavel INT NULL,
  INDEX idx_chamado_id_departamento (id_departamento),
  INDEX idx_chamado_id_agente_responsavel (id_agente_responsavel),
  CONSTRAINT fk_chamado_departamento FOREIGN KEY (id_departamento) REFERENCES departamento(id) ON DELETE SET NULL,
  CONSTRAINT fk_chamado_atendente_responsavel FOREIGN KEY (id_agente_responsavel) REFERENCES agente(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE mensagem_ticket (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  conteudo TEXT NOT NULL,
  interno BOOLEAN NOT NULL DEFAULT FALSE,
  do_agente BOOLEAN NOT NULL DEFAULT FALSE,
  id_mensagem_whatsapp VARCHAR(191) NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  id_chamado INT NOT NULL,
  id_agente INT NULL,
  INDEX idx_mensagem_ticket_id_chamado (id_chamado),
  INDEX idx_mensagem_ticket_id_agente (id_agente),
  CONSTRAINT fk_mensagem_ticket_chamado FOREIGN KEY (id_chamado) REFERENCES chamado(id) ON DELETE CASCADE,
  CONSTRAINT fk_mensagem_ticket_agente FOREIGN KEY (id_agente) REFERENCES agente(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE ticket_historico (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  acao VARCHAR(191) NOT NULL,
  detalhes TEXT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  id_chamado INT NOT NULL,
  id_agente INT NULL,
  INDEX idx_ticket_historico_id_chamado (id_chamado),
  INDEX idx_ticket_historico_id_agente (id_agente),
  CONSTRAINT fk_ticket_historico_chamado FOREIGN KEY (id_chamado) REFERENCES chamado(id) ON DELETE CASCADE,
  CONSTRAINT fk_ticket_historico_agente FOREIGN KEY (id_agente) REFERENCES agente(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE etiqueta (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(191) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE chamado_etiqueta (
  id_chamado INT NOT NULL,
  id_etiqueta INT NOT NULL,
  PRIMARY KEY (id_chamado, id_etiqueta),
  INDEX idx_chamado_etiqueta_chamado (id_chamado),
  INDEX idx_chamado_etiqueta_etiqueta (id_etiqueta),
  CONSTRAINT fk_chamado_etiqueta_chamado FOREIGN KEY (id_chamado) REFERENCES chamado(id) ON DELETE CASCADE,
  CONSTRAINT fk_chamado_etiqueta_etiqueta FOREIGN KEY (id_etiqueta) REFERENCES etiqueta(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE registro_pontos (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  pontos INT NOT NULL,
  motivo ENUM('CHAMADO_RESOLVIDO','SLA_CUMPRIDO','PRIMEIRA_RESPOSTA','SATISFACAO_CLIENTE','BONUS','PENALIDADE') NOT NULL,
  observacao TEXT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  id_agente INT NOT NULL,
  id_chamado INT NULL,
  INDEX idx_registro_pontos_id_agente (id_agente),
  INDEX idx_registro_pontos_id_chamado (id_chamado),
  CONSTRAINT fk_registro_pontos_agente FOREIGN KEY (id_agente) REFERENCES agente(id) ON DELETE CASCADE,
  CONSTRAINT fk_registro_pontos_chamado FOREIGN KEY (id_chamado) REFERENCES chamado(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE sessao_whatsapp (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  telefone VARCHAR(50) NOT NULL UNIQUE,
  nome VARCHAR(191) NULL,
  id_chamado INT NULL,
  ultima_mensagem_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sessao_whatsapp_id_chamado (id_chamado),
  CONSTRAINT fk_sessao_whatsapp_chamado FOREIGN KEY (id_chamado) REFERENCES chamado(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DELIMITER $$
CREATE TRIGGER trg_departamento_atualizado_em
BEFORE UPDATE ON departamento
FOR EACH ROW
BEGIN
  SET NEW.atualizado_em = CURRENT_TIMESTAMP;
END$$

CREATE TRIGGER trg_agente_atualizado_em
BEFORE UPDATE ON agente
FOR EACH ROW
BEGIN
  SET NEW.atualizado_em = CURRENT_TIMESTAMP;
END$$

CREATE TRIGGER trg_politica_sla_atualizado_em
BEFORE UPDATE ON politica_sla
FOR EACH ROW
BEGIN
  SET NEW.atualizado_em = CURRENT_TIMESTAMP;
END$$

CREATE TRIGGER trg_chamado_atualizado_em
BEFORE UPDATE ON chamado
FOR EACH ROW
BEGIN
  SET NEW.atualizado_em = CURRENT_TIMESTAMP;
END$$
DELIMITER ;
