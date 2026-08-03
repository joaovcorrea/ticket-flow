DROP TRIGGER IF EXISTS trg_chamado_after_insert;
CREATE TRIGGER trg_chamado_after_insert
AFTER INSERT ON chamado
FOR EACH ROW
BEGIN
  INSERT INTO chamado_auditoria (
    chamadoId,
    evento,
    idAgente,
    dadosAntes,
    dadosDepois,
    link,
    criadoEm
  ) VALUES (
    NEW.id,
    'create',
    NEW.idAgenteResponsavel,
    NULL,
    JSON_OBJECT(
      'id', NEW.id,
      'numeroChamado', NEW.numeroChamado,
      'assunto', NEW.assunto,
      'descricao', NEW.descricao,
      'status', NEW.status,
      'prioridade', NEW.prioridade,
      'origem', NEW.origem,
      'statusSla', NEW.statusSla,
      'nomeSolicitante', NEW.nomeSolicitante,
      'telefoneSolicitante', NEW.telefoneSolicitante,
      'emailSolicitante', NEW.emailSolicitante,
      'primeiraRespostaEm', NEW.primeiraRespostaEm,
      'resolvidoEm', NEW.resolvidoEm,
      'fechadoEm', NEW.fechadoEm,
      'reabertoEm', NEW.reabertoEm,
      'slaVencimentoEm', NEW.slaVencimentoEm,
      'primeiraRespostaVencimentoEm', NEW.primeiraRespostaVencimentoEm,
      'idChatWhatsapp', NEW.idChatWhatsapp,
      'idDepartamento', NEW.idDepartamento,
      'idAgenteResponsavel', NEW.idAgenteResponsavel
    ),
    CONCAT('/tickets/', NEW.id),
    NOW()
  );
END;

DROP TRIGGER IF EXISTS trg_chamado_after_update;
CREATE TRIGGER trg_chamado_after_update
AFTER UPDATE ON chamado
FOR EACH ROW
BEGIN
  INSERT INTO chamado_auditoria (
    chamadoId,
    evento,
    idAgente,
    dadosAntes,
    dadosDepois,
    link,
    criadoEm
  ) VALUES (
    NEW.id,
    'update',
    NEW.idAgenteResponsavel,
    JSON_OBJECT(
      'id', OLD.id,
      'numeroChamado', OLD.numeroChamado,
      'assunto', OLD.assunto,
      'descricao', OLD.descricao,
      'status', OLD.status,
      'prioridade', OLD.prioridade,
      'origem', OLD.origem,
      'statusSla', OLD.statusSla,
      'nomeSolicitante', OLD.nomeSolicitante,
      'telefoneSolicitante', OLD.telefoneSolicitante,
      'emailSolicitante', OLD.emailSolicitante,
      'primeiraRespostaEm', OLD.primeiraRespostaEm,
      'resolvidoEm', OLD.resolvidoEm,
      'fechadoEm', OLD.fechadoEm,
      'reabertoEm', OLD.reabertoEm,
      'slaVencimentoEm', OLD.slaVencimentoEm,
      'primeiraRespostaVencimentoEm', OLD.primeiraRespostaVencimentoEm,
      'idChatWhatsapp', OLD.idChatWhatsapp,
      'idDepartamento', OLD.idDepartamento,
      'idAgenteResponsavel', OLD.idAgenteResponsavel
    ),
    JSON_OBJECT(
      'id', NEW.id,
      'numeroChamado', NEW.numeroChamado,
      'assunto', NEW.assunto,
      'descricao', NEW.descricao,
      'status', NEW.status,
      'prioridade', NEW.prioridade,
      'origem', NEW.origem,
      'statusSla', NEW.statusSla,
      'nomeSolicitante', NEW.nomeSolicitante,
      'telefoneSolicitante', NEW.telefoneSolicitante,
      'emailSolicitante', NEW.emailSolicitante,
      'primeiraRespostaEm', NEW.primeiraRespostaEm,
      'resolvidoEm', NEW.resolvidoEm,
      'fechadoEm', NEW.fechadoEm,
      'reabertoEm', NEW.reabertoEm,
      'slaVencimentoEm', NEW.slaVencimentoEm,
      'primeiraRespostaVencimentoEm', NEW.primeiraRespostaVencimentoEm,
      'idChatWhatsapp', NEW.idChatWhatsapp,
      'idDepartamento', NEW.idDepartamento,
      'idAgenteResponsavel', NEW.idAgenteResponsavel
    ),
    CONCAT('/tickets/', NEW.id),
    NOW()
  );
END;

DROP TRIGGER IF EXISTS trg_chamado_after_delete;
CREATE TRIGGER trg_chamado_after_delete
BEFORE DELETE ON chamado
FOR EACH ROW
BEGIN
  INSERT INTO chamado_auditoria (
    chamadoId,
    evento,
    idAgente,
    dadosAntes,
    dadosDepois,
    link,
    criadoEm
  ) VALUES (
    OLD.id,
    'delete',
    OLD.idAgenteResponsavel,
    JSON_OBJECT(
      'id', OLD.id,
      'numeroChamado', OLD.numeroChamado,
      'assunto', OLD.assunto,
      'descricao', OLD.descricao,
      'status', OLD.status,
      'prioridade', OLD.prioridade,
      'origem', OLD.origem,
      'statusSla', OLD.statusSla,
      'nomeSolicitante', OLD.nomeSolicitante,
      'telefoneSolicitante', OLD.telefoneSolicitante,
      'emailSolicitante', OLD.emailSolicitante,
      'primeiraRespostaEm', OLD.primeiraRespostaEm,
      'resolvidoEm', OLD.resolvidoEm,
      'fechadoEm', OLD.fechadoEm,
      'reabertoEm', OLD.reabertoEm,
      'slaVencimentoEm', OLD.slaVencimentoEm,
      'primeiraRespostaVencimentoEm', OLD.primeiraRespostaVencimentoEm,
      'idChatWhatsapp', OLD.idChatWhatsapp,
      'idDepartamento', OLD.idDepartamento,
      'idAgenteResponsavel', OLD.idAgenteResponsavel
    ),
    NULL,
    CONCAT('/tickets/', OLD.id),
    NOW()
  );
END;
