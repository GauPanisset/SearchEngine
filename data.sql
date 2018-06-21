CREATE TABLE Product(
   Id INTEGER PRIMARY KEY   AUTOINCREMENT,
   Brand TEXT,
   Color TEXT,
   Color_type TEXT,
   Material TEXT,
   Object TEXT
);

INSERT INTO Product (Brand, Color, Color_type, Material, Object)
VALUES ("BrandTest1", "Vert", "Unie", "Verre", "Coupe");

INSERT INTO Product (Brand, Color, Color_type, Material, Object)
VALUES ("BrandTest1", "Bleu", "Motif", "Bois", "Assiette");

INSERT INTO Product (Brand, Color, Color_type, Material, Object)
VALUES ("BrandTest2", "Vert", "Motif", "Bois", "Tableau");

INSERT INTO Product (Brand, Color, Color_type, Material, Object)
VALUES ("BrandTest3", "Rouge", "Motif", "Metal", "Couteau");

INSERT INTO Product (Brand, Color, Color_type, Material, Object)
VALUES ("BrandTest3", "Noir", "Unie", "Tissu", "Serviette");

INSERT INTO Product (Brand, Color, Color_type, Material, Object)
VALUES ("BrandTest3", "Multicolor", "Motif", "Coton", "Serviette");

INSERT INTO Product (Brand, Color, Color_type, Material, Object)
VALUES ("BrandTesT4", "Jaune", "Unie", "Carton", "Assiette");

CREATE TABLE IndexTable(
    Id INTEGER PRIMARY KEY AUTOINCREMENT,
    Word TEXT,
    Attribute TEXT
);

CREATE TABLE Is_in(
    Id INTEGER,
    Id_prod INTEGER
);
