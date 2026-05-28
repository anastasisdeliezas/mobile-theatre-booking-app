CREATE DATABASE IF NOT EXISTS theatre_booking;
USE theatre_booking;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS contact_messages;
DROP TABLE IF EXISTS reservation_seats;
DROP TABLE IF EXISTS reservations;
DROP TABLE IF EXISTS promo_codes;
DROP TABLE IF EXISTS showtimes;
DROP TABLE IF EXISTS shows;
DROP TABLE IF EXISTS seats;
DROP TABLE IF EXISTS theatres;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;


CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  phone VARCHAR(40) NULL,
  avatar_url VARCHAR(500) NULL,
  bio TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE theatres (
  theatre_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  location VARCHAR(150) NOT NULL,
  description TEXT,
  avatar_url VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE shows (
  show_id INT AUTO_INCREMENT PRIMARY KEY,
  theatre_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  genre VARCHAR(80) NULL,
  description TEXT,
  duration_minutes INT NOT NULL,
  age_rating VARCHAR(20),
  poster_url VARCHAR(255),
  hero_image_url VARCHAR(500) NULL,
  trailer_url VARCHAR(1000) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_shows_theatre FOREIGN KEY (theatre_id) REFERENCES theatres(theatre_id) ON DELETE CASCADE
);

CREATE TABLE showtimes (
  showtime_id INT AUTO_INCREMENT PRIMARY KEY,
  show_id INT NOT NULL,
  hall_name VARCHAR(80) NOT NULL,
  start_time DATETIME NOT NULL,
  base_price DECIMAL(8,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_showtimes_show FOREIGN KEY (show_id) REFERENCES shows(show_id) ON DELETE CASCADE
);

CREATE TABLE seats (
  seat_id INT AUTO_INCREMENT PRIMARY KEY,
  row_label CHAR(1) NOT NULL,
  seat_number INT NOT NULL,
  category ENUM('VIP', 'Regular', 'Economy') NOT NULL DEFAULT 'Regular',
  UNIQUE KEY uq_seat (row_label, seat_number)
);

CREATE TABLE promo_codes (
  promo_id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(80) NOT NULL UNIQUE,
  title VARCHAR(160) NOT NULL,
  description TEXT NULL,
  discount_type ENUM('percent','fixed') NOT NULL DEFAULT 'percent',
  discount_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reservations (
  reservation_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  showtime_id INT NOT NULL,
  booking_code VARCHAR(60) NOT NULL UNIQUE,
  status ENUM('pending', 'confirmed', 'cancelled') NOT NULL DEFAULT 'confirmed',
  expires_at DATETIME NULL,
  payment_method VARCHAR(50) NULL,
  card_last4 VARCHAR(4) NULL,
  promo_id INT NULL,
  promo_code VARCHAR(80) NULL,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  final_price DECIMAL(10,2) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_res_user FOREIGN KEY (user_id) REFERENCES users(user_id),
  CONSTRAINT fk_res_showtime FOREIGN KEY (showtime_id) REFERENCES showtimes(showtime_id),
  CONSTRAINT fk_res_promo FOREIGN KEY (promo_id) REFERENCES promo_codes(promo_id) ON DELETE SET NULL
);

CREATE TABLE reservation_seats (
  reservation_seat_id INT AUTO_INCREMENT PRIMARY KEY,
  reservation_id INT NOT NULL,
  showtime_id INT NOT NULL,
  seat_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rs_reservation FOREIGN KEY (reservation_id) REFERENCES reservations(reservation_id) ON DELETE CASCADE,
  CONSTRAINT fk_rs_showtime FOREIGN KEY (showtime_id) REFERENCES showtimes(showtime_id) ON DELETE CASCADE,
  CONSTRAINT fk_rs_seat FOREIGN KEY (seat_id) REFERENCES seats(seat_id),
  UNIQUE KEY uq_showtime_seat (showtime_id, seat_id)
);

CREATE TABLE contact_messages (
  message_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  subject VARCHAR(200) NULL,
  message TEXT NOT NULL,
  status ENUM('new','read','replied') NOT NULL DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE refresh_tokens (
  refresh_token_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

INSERT INTO theatres (name, location, description, avatar_url) VALUES
  ('Θέατρο Παλλάς', 'Αθήνα', 'Ιστορικός θεατρικός χώρος στο κέντρο της Αθήνας με μεγάλες παραγωγές, μιούζικαλ και κλασικό ρεπερτόριο.', 'https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=1200&q=80'),
  ('Δημοτικό Θέατρο Πειραιά', 'Πειραιάς', 'Εμβληματικό νεοκλασικό θέατρο με μεγάλες κεντρικές παραγωγές, ανανεωμένο πρόγραμμα και άνετους χώρους υποδοχής.', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80'),
  ('Θέατρο Ολύμπια', 'Αθήνα', 'Κλασικός χώρος για δράμα, τραγωδία, μουσικές παραστάσεις και ειδικές εορταστικές παραγωγές.', 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=1200&q=80'),
  ('Northern Lights Theatre', 'Θεσσαλονίκη', 'Σύγχρονη αίθουσα με premium καθίσματα, family-friendly παραστάσεις και βραδινές παραγωγές υψηλής αισθητικής.', 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80'),
  ('Open Air Drama Arena', 'Πάτρα', 'Ανοιχτό θέατρο για καλοκαιρινές παραστάσεις, αρχαίο δράμα και μεγάλες ensemble παραγωγές.', 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1200&q=80'),
  ('Metropolitan Black Box', 'Αθήνα', 'Πειραματική σκηνή για σύγχρονα έργα, νέους δημιουργούς και intimate εμπειρία θεατή.', 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1200&q=80'),
  ('Grand Riviera Stage', 'Θεσσαλονίκη', 'Μεγάλη κεντρική σκηνή για μιούζικαλ και λαμπερές παραγωγές με εντυπωσιακά τεχνικά μέσα.', 'https://images.unsplash.com/photo-1499364615650-ec38552f4f34?auto=format&fit=crop&w=1200&q=80'),
  ('Little Orchard Theatre', 'Ηράκλειο', 'Ζεστός θεατρικός χώρος με έμφαση σε οικογενειακές παραστάσεις, ελληνικό έργο και πολιτιστικές δράσεις.', 'https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=1200&q=80');

INSERT INTO shows (theatre_id, title, genre, description, duration_minutes, age_rating, poster_url, hero_image_url, trailer_url) VALUES
  (1, 'Άμλετ', 'Δράμα', 'Μια σύγχρονη σκηνική ανάγνωση του σαιξπηρικού έργου που εστιάζει στην παρακμή της εξουσίας, στη σύγκρουση οικογένειας και κράτους και στη σταδιακή αποσύνθεση του ήρωα. Πρωταγωνιστούν οι Αλέξης Μαρής, Έλενα Σταύρου και Μάριος Θεοδώρου, ενώ η σκηνοθεσία του Κωνσταντίνου Ρήγα δίνει έμφαση στη σκοτεινή ατμόσφαιρα, στα projections και στη ζωντανή μουσική. Η παραγωγή απευθύνεται σε κοινό που αναζητά κλασικό θέατρο υψηλής έντασης με σύγχρονη εικαστική ταυτότητα.', 135, '13+', 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1524985069026-dd778a71c7b4?auto=format&fit=crop&w=1400&q=80', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
  (1, 'Το Μεγάλο Μας Τσίρκο', 'Μιούζικαλ', 'Η ιστορική μουσικοθεατρική παράσταση επιστρέφει με μεγάλο ensemble, ζωντανή ορχήστρα και έντονο ρυθμό. Η παραγωγή της Άννας Θεοχάρη συνδυάζει αφήγηση, τραγούδι, πολιτικό σχόλιο και πλούσιο σκηνικό περιβάλλον, με πρωταγωνιστές τους Βίκυ Ανδρέου και Πέτρο Βασιλείου. Ιδανική επιλογή για θεατές που αγαπούν μεγάλα θεάματα με ιστορική και συλλογική διάσταση.', 125, '10+', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=1400&q=80', NULL),
  (2, 'Μήδεια', 'Τραγωδία', 'Αρχαία τραγωδία με σύγχρονη μουσική επένδυση, έντονο φωτιστικό σχεδιασμό και αυστηρή σκηνική γραμμή. Η Κατερίνα Δούκα ερμηνεύει τη Μήδεια σε μια παραγωγή που δίνει χώρο στον λόγο, στον Χορό και στη σωματική ένταση. Περιλαμβάνει δυνατές συναισθηματικές κορυφώσεις και προτείνεται σε κοινό που εκτιμά το αρχαίο δράμα και τις απαιτητικές ερμηνείες.', 105, '15+', 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1400&q=80', NULL),
  (2, 'Ο Επιθεωρητής', 'Κωμωδία', 'Η διάσημη σάτιρα του Γκόγκολ ζωντανεύει με γρήγορες μεταβάσεις, ξεκαρδιστικές παρεξηγήσεις και σύγχρονη ρυθμική σκηνοθεσία. Ο Στέλιος Ζέρβας και η Εύα Νικολάου ηγούνται ενός συνόλου που αναδεικνύει με χιούμορ τη διαφθορά και την κοινωνική υποκρισία. Μια έξυπνη, απολαυστική επιλογή για βραδινή έξοδο.', 110, '12+', 'https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=1400&q=80', NULL),
  (3, 'Αντιγόνη', 'Τραγωδία', 'Μια λιτή και δυναμική εκδοχή της Αντιγόνης που φωτίζει τη σύγκρουση ανάμεσα στον κρατικό νόμο και την προσωπική συνείδηση. Η σκηνοθεσία της Ναταλίας Σαμαρά χρησιμοποιεί καθαρές γεωμετρίες, χορό και αυστηρό φωτισμό, ενώ πρωταγωνιστούν η Ιωάννα Μεσσήνη και ο Δημήτρης Πατίλης. Κατάλληλη για κοινό που αγαπά τις κλασικές τραγωδίες σε σύγχρονη σκηνική γλώσσα.', 100, '12+', 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1400&q=80', NULL),
  (3, 'Ο Γυάλινος Κόσμος', 'Δράμα', 'Το κλασικό οικογενειακό δράμα του Τενεσί Ουίλιαμς παρουσιάζεται με έμφαση στην εύθραυστη ατμόσφαιρα, στην τρυφερότητα και στις λεπτές αποχρώσεις των σχέσεων. Η Μαρία Τσάκου, ο Γιώργος Μανιάτης και η Έφη Κορρέ συνθέτουν ένα ισχυρό υποκριτικό τρίγωνο, πλαισιωμένο από κινηματογραφικό φωτισμό και μουσική που υπογραμμίζει τη μνήμη και τη νοσταλγία.', 115, '12+', 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=1400&q=80', NULL),
  (4, 'Οι Μάγισσες της Σμύρνης', 'Σύγχρονο', 'Μια μεγάλη αφηγηματική παραγωγή με ιστορικό φόντο, ζωντανή μουσική και πλούσιο σκηνικό περιβάλλον. Η σκηνοθεσία της Λένας Κωστίκου αναδεικνύει τις γυναικείες διαδρομές, την αίσθηση εποχής και τη λαϊκή μνήμη, με δυνατές ερμηνείες από την Άννα Σολωμού και τη Ρένα Παπαδοπούλου. Ιδανική για κοινό που αγαπά ιστορικές παραστάσεις μεγάλης κλίμακας.', 130, '13+', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=1400&q=80', NULL),
  (4, 'Το Καπλάνι της Βιτρίνας', 'Παιδικό', 'Η αγαπημένη παιδική ιστορία μεταφέρεται στη σκηνή με χρώμα, ζωντανή αφήγηση, μουσική και διαδραστικά στοιχεία. Η σκηνοθεσία της Βίκυς Χατζή δημιουργεί ένα φιλόξενο θεατρικό περιβάλλον για παιδιά και γονείς, με έμφαση στη φαντασία, στη φιλία και στη χαρά της πρώτης επαφής με το θέατρο.', 85, '6+', 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?auto=format&fit=crop&w=1400&q=80', NULL),
  (5, 'Ιφιγένεια εν Αυλίδι', 'Τραγωδία', 'Καλοκαιρινή παραγωγή σε ανοιχτό θέατρο με δυναμικό ensemble, τελετουργική ατμόσφαιρα και έμφαση στη θυσία ως πολιτική πράξη. Η Περσεφόνη Μαρκάκη σκηνοθετεί μια παράσταση που αξιοποιεί τον αέρα του ανοιχτού χώρου, τη ζωντανή μουσική και τη σωματικότητα του Χορού. Ιδανική επιλογή για θεατές που θέλουν να ζήσουν αρχαίο δράμα κάτω από τον νυχτερινό ουρανό.', 120, '13+', 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1400&q=80', NULL),
  (5, 'Βασιλιάς Ληρ', 'Δράμα', 'Μεγάλη τραγωδία εξουσίας, γερασμένου εγωισμού και οικογενειακής διάλυσης σε μια ανοιχτή σκηνή που επιτρέπει στην εικόνα και στον ήχο να αποκτήσουν επικό χαρακτήρα. Ο Μανώλης Στεφανής στον πρωταγωνιστικό ρόλο οδηγεί μια παράσταση υψηλής έντασης, με εντυπωσιακές σκηνές καταιγίδας και ισχυρό εικαστικό όραμα.', 150, '15+', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80', NULL),
  (6, 'Η Τάξη Μας', 'Σύγχρονο', 'Σύγχρονο έργο για τη μνήμη, τη συλλογική ενοχή και τη δύσκολη συνύπαρξη. Η παράσταση δίνεται σε μικρή σκηνή ώστε να διατηρείται η ένταση της μαρτυρίας και η εγγύτητα με το κοινό. Η σκηνοθεσία της Άρτεμις Βεντούρη και οι ερμηνείες των Λευτέρη Μπίκου και Μυρτώς Αντύπα δημιουργούν ένα πυκνό, απαιτητικό αλλά ουσιαστικό θεατρικό γεγονός.', 95, '15+', 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1400&q=80', NULL),
  (6, 'Ο Θείος Βάνιας', 'Δράμα', 'Μια νέα μετάφραση του Τσέχωφ με χιούμορ, μελαγχολία και ζεστή σκηνική εγγύτητα. Η παραγωγή αναδεικνύει τις ανεκπλήρωτες επιθυμίες, τη φθορά και την τρυφερότητα των χαρακτήρων, με πρωταγωνιστές τον Κώστα Φίλιππα, τη Σοφία Καρρά και τον Γιάννη Φωκά. Ιδανικό για κοινό που αγαπά το κλασικό δραματικό ρεπερτόριο.', 122, '12+', 'https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=1400&q=80', NULL),
  (7, 'Cabaret', 'Μιούζικαλ', 'Το θρυλικό μιούζικαλ ανεβαίνει με live band, λαμπερές χορογραφίες και σκηνοθεσία που ισορροπεί τη διασκέδαση με τη σκοτεινή πολιτική υπογράμμιση του έργου. Οι Λήδα Αρβανίτη και Ανδρέας Χρόνης ηγούνται μιας μεγάλης παραγωγής με εντυπωσιακά κοστούμια, φωτισμούς και υψηλή ενέργεια. Μία από τις πιο θεαματικές προτάσεις της σεζόν.', 145, '15+', 'https://images.unsplash.com/photo-1499364615650-ec38552f4f34?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=1400&q=80', NULL),
  (7, 'Το Ξύπνημα της Άνοιξης', 'Μιούζικαλ', 'Βραβευμένο νεανικό μιούζικαλ για την ενηλικίωση, την κοινωνική καταπίεση και την ανάγκη της αυτοέκφρασης. Η παραγωγή αξιοποιεί σύγχρονο ηχητικό σχεδιασμό, έντονες χορογραφίες και συναυλιακή ενέργεια, δημιουργώντας μια εμπειρία που μιλά ιδιαίτερα σε νεανικό κοινό και φοιτητές.', 128, '15+', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80', NULL),
  (3, 'Οιδίπους Τύραννος', 'Τραγωδία', 'Συμπαγής και έντονη ανάγνωση του Σοφοκλή, με έμφαση στη γνώση, στην ευθύνη της εξουσίας και στην πτώση του ήρωα. Ο Γιώργος Δανιήλ και η Μαίρη Κάλβου πλαισιώνονται από έναν ισχυρό Χορό, ενώ η μουσική και οι φωτισμοί χτίζουν σταδιακά την τραγική ατμόσφαιρα. Προτείνεται για κοινό που αγαπά το αρχαίο δράμα σε καθαρή, σύγχρονη γραμμή.', 108, '13+', 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1400&q=80', NULL),
  (8, 'Πλούτος', 'Κωμωδία', 'Η αριστοφανική κωμωδία παρουσιάζεται με γιορτινή διάθεση, μουσικό ρυθμό και σαφή σύγχρονα σχόλια πάνω στον πλούτο και την κοινωνική ανισότητα. Η σκηνοθεσία του Στέφανου Καρύδα συνδυάζει λαϊκό χιούμορ, έντονη διαδραστικότητα με το κοινό και προσβάσιμη θεατρική γλώσσα, καθιστώντας την παράσταση ιδανική και για ευρύτερο κοινό.', 98, '10+', 'https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80', NULL),
  (8, 'Γάμος του Φίγκαρο', 'Κωμωδία', 'Η κλασική κωμωδία παρεξηγήσεων μεταφέρεται στη σκηνή με νεύρο, ταχύτητα και σπιρτάδα. Οι Παναγιώτης Κόλλιας, Εύη Μπεκιάρη και Θεόφιλος Κωστής πρωταγωνιστούν σε μια παραγωγή που δίνει έμφαση στο ensemble, στις γρήγορες μεταβάσεις και στη διαχρονική κοινωνική ειρωνεία του έργου.', 118, '10+', 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1499364615650-ec38552f4f34?auto=format&fit=crop&w=1400&q=80', NULL),
  (2, 'Ματωμένος Γάμος', 'Δράμα', 'Ο λυρικός κόσμος του Λόρκα παρουσιάζεται με ζωντανά έγχορδα, έντονη σωματικότητα και ποιητική σκηνική γραφή. Η Άννα Ρήγα, ο Χάρης Μπάρκας και ο Νικόλας Σπανός συνθέτουν ένα δυνατό ερμηνευτικό τρίγωνο σε μια παράσταση που ισορροπεί ανάμεσα στο πάθος, στο μοιραίο και στην ομορφιά της θεατρικής εικόνας.', 112, '14+', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&w=1400&q=80', NULL),
  (4, 'Το Τρίτο Στεφάνι', 'Σύγχρονο', 'Το μυθιστορηματικό σύμπαν του έργου μεταφέρεται στη σκηνή με έντονη γυναικεία παρουσία, ζωντανό μουσικό χρώμα και πολλαπλά αφηγηματικά επίπεδα. Η παραγωγή αναδεικνύει τη λαϊκή μνήμη, το προσωπικό βίωμα και τη δύναμη της αφήγησης, με πρωταγωνίστριες τη Φωτεινή Ρώμα και την Αγγελική Στεργίου.', 138, '13+', 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=900&q=80', 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1400&q=80', NULL);

INSERT INTO showtimes (show_id, hall_name, start_time, base_price) VALUES
  (1, 'Κεντρική Σκηνή', '2026-05-21 20:00:00', 20.00),
  (1, 'Κεντρική Σκηνή', '2026-05-24 21:15:00', 20.90),
  (1, 'Κεντρική Σκηνή', '2026-05-27 20:00:00', 18.80),
  (2, 'Κεντρική Σκηνή', '2026-05-22 20:00:00', 21.50),
  (2, 'Κεντρική Σκηνή', '2026-05-25 21:15:00', 22.30),
  (2, 'Κεντρική Σκηνή', '2026-05-28 19:00:00', 20.60),
  (3, 'Grand Hall', '2026-05-23 20:00:00', 23.00),
  (3, 'Grand Hall', '2026-05-26 21:15:00', 23.70),
  (3, 'Grand Hall', '2026-05-29 20:00:00', 22.40),
  (4, 'Grand Hall', '2026-05-24 20:00:00', 24.50),
  (4, 'Grand Hall', '2026-05-27 21:15:00', 25.10),
  (4, 'Grand Hall', '2026-05-30 19:00:00', 17.00),
  (5, 'Olympia Stage', '2026-05-25 20:00:00', 18.50),
  (5, 'Olympia Stage', '2026-05-28 21:15:00', 26.50),
  (5, 'Olympia Stage', '2026-05-31 20:00:00', 18.80),
  (6, 'Olympia Stage', '2026-05-26 20:00:00', 20.00),
  (6, 'Olympia Stage', '2026-05-29 21:15:00', 19.50),
  (6, 'Olympia Stage', '2026-06-01 20:00:00', 20.60),
  (7, 'North Stage', '2026-05-27 20:00:00', 21.50),
  (7, 'North Stage', '2026-05-30 21:15:00', 20.90),
  (7, 'North Stage', '2026-06-02 20:00:00', 22.40),
  (8, 'North Stage', '2026-05-28 20:00:00', 23.00),
  (8, 'North Stage', '2026-05-31 21:15:00', 22.30),
  (8, 'North Stage', '2026-06-03 17:30:00', 17.00),
  (9, 'Open Air Main', '2026-05-29 20:00:00', 24.50),
  (9, 'Open Air Main', '2026-06-01 21:15:00', 23.70),
  (9, 'Open Air Main', '2026-06-04 20:00:00', 18.80),
  (10, 'Open Air Main', '2026-05-30 20:00:00', 18.50),
  (10, 'Open Air Main', '2026-06-02 21:15:00', 25.10),
  (10, 'Open Air Main', '2026-06-05 20:00:00', 20.60),
  (11, 'Black Box A', '2026-05-31 20:00:00', 20.00),
  (11, 'Black Box A', '2026-06-03 21:15:00', 26.50),
  (11, 'Black Box A', '2026-06-06 20:00:00', 22.40),
  (12, 'Black Box A', '2026-06-01 20:00:00', 21.50),
  (12, 'Black Box A', '2026-06-04 21:15:00', 19.50),
  (12, 'Black Box A', '2026-06-07 20:00:00', 17.00),
  (13, 'Riviera Main Stage', '2026-06-02 20:00:00', 23.00),
  (13, 'Riviera Main Stage', '2026-06-05 21:15:00', 20.90),
  (13, 'Riviera Main Stage', '2026-06-08 19:00:00', 18.80),
  (14, 'Riviera Main Stage', '2026-06-03 20:00:00', 24.50),
  (14, 'Riviera Main Stage', '2026-06-06 21:15:00', 22.30),
  (14, 'Riviera Main Stage', '2026-06-09 19:00:00', 20.60),
  (15, 'Olympia Stage', '2026-06-04 20:00:00', 18.50),
  (15, 'Olympia Stage', '2026-06-07 21:15:00', 23.70),
  (15, 'Olympia Stage', '2026-06-10 20:00:00', 22.40),
  (16, 'Family Hall', '2026-06-05 20:00:00', 20.00),
  (16, 'Family Hall', '2026-06-08 21:15:00', 25.10),
  (16, 'Family Hall', '2026-06-11 19:00:00', 17.00),
  (17, 'Family Hall', '2026-06-06 20:00:00', 21.50),
  (17, 'Family Hall', '2026-06-09 21:15:00', 26.50),
  (17, 'Family Hall', '2026-06-12 19:00:00', 18.80),
  (18, 'Grand Hall', '2026-06-07 20:00:00', 23.00),
  (18, 'Grand Hall', '2026-06-10 21:15:00', 19.50),
  (18, 'Grand Hall', '2026-06-13 20:00:00', 20.60),
  (19, 'North Stage', '2026-06-08 20:00:00', 24.50),
  (19, 'North Stage', '2026-06-11 21:15:00', 20.90),
  (19, 'North Stage', '2026-06-14 20:00:00', 22.40);

INSERT INTO seats (row_label, seat_number, category) VALUES
  ('A', 1, 'VIP'),
  ('A', 2, 'VIP'),
  ('A', 3, 'VIP'),
  ('A', 4, 'VIP'),
  ('A', 5, 'VIP'),
  ('A', 6, 'VIP'),
  ('A', 7, 'VIP'),
  ('A', 8, 'VIP'),
  ('B', 1, 'VIP'),
  ('B', 2, 'VIP'),
  ('B', 3, 'VIP'),
  ('B', 4, 'VIP'),
  ('B', 5, 'VIP'),
  ('B', 6, 'VIP'),
  ('B', 7, 'VIP'),
  ('B', 8, 'VIP'),
  ('C', 1, 'Regular'),
  ('C', 2, 'Regular'),
  ('C', 3, 'Regular'),
  ('C', 4, 'Regular'),
  ('C', 5, 'Regular'),
  ('C', 6, 'Regular'),
  ('C', 7, 'Regular'),
  ('C', 8, 'Regular'),
  ('D', 1, 'Regular'),
  ('D', 2, 'Regular'),
  ('D', 3, 'Regular'),
  ('D', 4, 'Regular'),
  ('D', 5, 'Regular'),
  ('D', 6, 'Regular'),
  ('D', 7, 'Regular'),
  ('D', 8, 'Regular'),
  ('E', 1, 'Economy'),
  ('E', 2, 'Economy'),
  ('E', 3, 'Economy'),
  ('E', 4, 'Economy'),
  ('E', 5, 'Economy'),
  ('E', 6, 'Economy'),
  ('E', 7, 'Economy'),
  ('E', 8, 'Economy'),
  ('F', 1, 'Economy'),
  ('F', 2, 'Economy'),
  ('F', 3, 'Economy'),
  ('F', 4, 'Economy'),
  ('F', 5, 'Economy'),
  ('F', 6, 'Economy'),
  ('F', 7, 'Economy'),
  ('F', 8, 'Economy');

INSERT INTO promo_codes (code, title, description, discount_type, discount_value, is_active) VALUES
  ('WELCOME10', 'Welcome Offer', '10% off για την πρώτη δοκιμαστική κράτηση', 'percent', 10, 1),
  ('SAVE5', 'Flat Discount', 'Σταθερή έκπτωση €5 στο checkout', 'fixed', 5, 1),
  ('SUMMER5', 'Summer Nights', '5% έκπτωση για καλοκαιρινές παραστάσεις', 'percent', 5, 1);

-- Demo admin user (password: Admin123!)
INSERT INTO users (name, email, password_hash, role) VALUES
  ('Admin User', 'admin@theatreapp.com', '$2a$10$e0NR8gW0XkyR3O6jwxKF1u9Ii.YTZGi99ZTSdKCbFf8gLuwZQzQ0a', 'admin');
