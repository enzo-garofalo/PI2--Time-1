DROP TABLE EVENTS;

CREATE TABLE EVENTS(
    ID_EVENT INTEGER NOT NULL PRIMARY KEY,
    TITLE VARCHAR2(100) NOT NULL,
    DESCRIPTION VARCHAR2(500) NOT NULL,
    CATEGORIES VARCHAR2(100) NOT NULL,
    STATUS_EVENT VARCHAR2(100) NOT NULL,
    -- 'sim' para aconteceu, 'não' para não aconteceu, null para ainda nÃo ocorrido 
    RESULT_EVENT VARCHAR2(10),
    REGISTER_DATE DATE DEFAULT SYSDATE,
    BETS_FUNDS NUMBER(*, 2) NOT NULL,
    FINISH_DATE DATE NOT NULL,

    FK_ID_USER INTEGER NOT NULL,

    CONSTRAINT FK_ID_USER FOREIGN KEY (FK_ID_USER) REFERENCES ACCOUNTS(ID)
);

ALTER TABLE EVENTS
MODIFY FINISH_DATE DATE;


UPDATE EVENTS
SET FINISH_DATE = TO_DATE(FINISH_DATE, 'YYYY-MM-DD');


CREATE SEQUENCE SEQ_EVENTS START WITH 1 INCREMENT BY 1;

SELECT * FROM EVENTS WHERE ID_EVENT = 372; 
UPDATE EVENTS
SET FINISH_DATE = TO_DATE('2024-12-02', 'YYYY-MM-DD')
WHERE ID_EVENT = 583;

UPDATE EVENTS
SET STATUS_EVENT = 'Aprovado'
WHERE ID_EVENT = 583;

DELETE FROM EVENTS;
DELETE FROM BETS;
COMMIT;

select * from BETS;


DESCRIBE EVENTS;

INSERT INTO EVENTS (
    ID_EVENT, 
    TITLE, 
    DESCRIPTION, 
    CATEGORIES, 
    STATUS_EVENT, 
    RESULT_EVENT, 
    REGISTER_DATE, 
    BETS_FUNDS, 
    FINISH_DATE, 
    FK_ID_USER
)
VALUES (
    SEQ_EVENTS.nextval, 
    'Evento Passado', 
    'Descrição do evento que já aconteceu', 
    'Categoria1', 
    'Aprovado', 
    'sim', 
    SYSDATE, 
    1000.00, 
    TO_DATE('2023-11-30', 'YYYY-MM-DD'), -- Data de término no passado
    221 -- ID do usuário que deve existir na tabela ACCOUNTS
);

