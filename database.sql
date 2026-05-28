-- MySQL dump 10.13  Distrib 9.5.0, for macos15 (x86_64)
--
-- Host: localhost    Database: theatre_booking
-- ------------------------------------------------------
-- Server version	9.5.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `theatre_booking`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `theatre_booking` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `theatre_booking`;

--
-- Table structure for table `contact_message_replies`
--

DROP TABLE IF EXISTS `contact_message_replies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_message_replies` (
  `reply_id` int NOT NULL AUTO_INCREMENT,
  `message_id` int NOT NULL,
  `sender_type` enum('admin','user') NOT NULL,
  `sender_id` int DEFAULT NULL,
  `body` text NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`reply_id`),
  KEY `message_id` (`message_id`),
  CONSTRAINT `contact_message_replies_ibfk_1` FOREIGN KEY (`message_id`) REFERENCES `contact_messages` (`message_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_message_replies`
--

LOCK TABLES `contact_message_replies` WRITE;
/*!40000 ALTER TABLE `contact_message_replies` DISABLE KEYS */;
INSERT INTO `contact_message_replies` VALUES (1,1,'admin',NULL,'kjsjkakjc;coa','2026-04-27 09:04:02');
INSERT INTO `contact_message_replies` VALUES (2,2,'admin',NULL,'tttttttt','2026-04-27 09:08:38');
INSERT INTO `contact_message_replies` VALUES (3,1,'user',NULL,'test','2026-04-27 09:41:23');
INSERT INTO `contact_message_replies` VALUES (4,1,'admin',NULL,'ok','2026-04-27 09:41:34');
INSERT INTO `contact_message_replies` VALUES (5,2,'admin',NULL,'ok','2026-04-27 09:41:38');
INSERT INTO `contact_message_replies` VALUES (6,3,'admin',NULL,'ok','2026-04-27 09:41:42');
INSERT INTO `contact_message_replies` VALUES (7,4,'admin',NULL,'testtt','2026-05-25 09:31:52');
/*!40000 ALTER TABLE `contact_message_replies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contact_messages`
--

DROP TABLE IF EXISTS `contact_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_messages` (
  `message_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(120) NOT NULL,
  `email` varchar(160) NOT NULL,
  `subject` varchar(200) DEFAULT NULL,
  `message` text NOT NULL,
  `status` enum('new','read','replied') NOT NULL DEFAULT 'new',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`message_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact_messages`
--

LOCK TABLES `contact_messages` WRITE;
/*!40000 ALTER TABLE `contact_messages` DISABLE KEYS */;
INSERT INTO `contact_messages` VALUES (1,'τεσττεστ','periergos122@gmail.com','testtt','gsghhshss','replied','2026-04-27 09:03:49');
INSERT INTO `contact_messages` VALUES (2,'Anastasis D','periergos122@gmail.com','dddddd','dddddd','replied','2026-04-27 09:08:27');
INSERT INTO `contact_messages` VALUES (3,'Anastasis D','periergos122@gmail.com','τεσττττ','τετστστστσττσσ','replied','2026-04-27 09:19:03');
INSERT INTO `contact_messages` VALUES (4,'δοκιμη δοκιμη','periergos122@gmail.com','dokimi','dokimidokimi','replied','2026-05-25 09:31:30');
/*!40000 ALTER TABLE `contact_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `newsletter_subscribers`
--

DROP TABLE IF EXISTS `newsletter_subscribers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `newsletter_subscribers` (
  `subscriber_id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(190) NOT NULL,
  `source` varchar(40) NOT NULL DEFAULT 'mobile_app',
  `status` enum('active','unsubscribed') NOT NULL DEFAULT 'active',
  `unsubscribed_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`subscriber_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `newsletter_subscribers`
--

LOCK TABLES `newsletter_subscribers` WRITE;
/*!40000 ALTER TABLE `newsletter_subscribers` DISABLE KEYS */;
INSERT INTO `newsletter_subscribers` VALUES (1,'test@gmail.com','mobile_app','active',NULL,'2026-04-22 09:35:24','2026-04-22 09:35:24');
/*!40000 ALTER TABLE `newsletter_subscribers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `promo_codes`
--

DROP TABLE IF EXISTS `promo_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `promo_codes` (
  `promo_id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(80) NOT NULL,
  `title` varchar(160) NOT NULL,
  `description` text,
  `discount_type` enum('percent','fixed') NOT NULL DEFAULT 'percent',
  `discount_value` decimal(10,2) NOT NULL DEFAULT '0.00',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`promo_id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `promo_codes`
--

LOCK TABLES `promo_codes` WRITE;
/*!40000 ALTER TABLE `promo_codes` DISABLE KEYS */;
INSERT INTO `promo_codes` VALUES (1,'WELCOME10','Welcome Offer','10% off για την πρώτη δοκιμαστική κράτηση','percent',10.00,1,'2026-04-19 14:13:59');
INSERT INTO `promo_codes` VALUES (2,'SAVE5','Flat Discount','Σταθερή έκπτωση €5 στο checkout','fixed',5.00,1,'2026-04-19 14:13:59');
INSERT INTO `promo_codes` VALUES (3,'SUMMER5','Summer Nights','5% έκπτωση για καλοκαιρινές παραστάσεις','percent',5.00,1,'2026-04-19 14:13:59');
/*!40000 ALTER TABLE `promo_codes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refresh_tokens`
--

DROP TABLE IF EXISTS `refresh_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `refresh_tokens` (
  `refresh_token_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `token_hash` char(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`refresh_token_id`),
  UNIQUE KEY `token_hash` (`token_hash`),
  KEY `fk_refresh_user` (`user_id`),
  CONSTRAINT `fk_refresh_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refresh_tokens`
--

LOCK TABLES `refresh_tokens` WRITE;
/*!40000 ALTER TABLE `refresh_tokens` DISABLE KEYS */;
INSERT INTO `refresh_tokens` VALUES (1,2,'0ac7d33dd48c02730ec1f81993d41e2a3b61a56c860530ae87d7d57a62d7f504','2026-05-19 18:09:25',NULL,'2026-04-19 15:09:25');
INSERT INTO `refresh_tokens` VALUES (2,3,'fc48455af10dd122641e7b3638ef69add90131c6a76eedffbd1a88872f8a6377','2026-05-19 18:18:13','2026-04-19 20:32:01','2026-04-19 15:18:13');
INSERT INTO `refresh_tokens` VALUES (3,2,'08784889d09cbc411885c34088bbf55ab9bf3a82623607cfca6afc0625fc2e3b','2026-05-19 20:25:19','2026-04-19 20:31:55','2026-04-19 17:25:18');
INSERT INTO `refresh_tokens` VALUES (4,2,'d2cbd7e9766aa95bc29fb41f3e039de5fb06e9da17a770dd8842a31c738b6a64','2026-05-19 20:32:27','2026-04-26 21:41:20','2026-04-19 17:32:27');
INSERT INTO `refresh_tokens` VALUES (5,2,'389fc6dbe9a20030408d8d455185d5c39aaed424a177bd02cb3adcc83924f1a2','2026-05-19 20:32:31',NULL,'2026-04-19 17:32:30');
INSERT INTO `refresh_tokens` VALUES (6,1,'86eb8525ee9df688b5f6d7d1632130e0410341c01e327e3a87b8bfb88f5925ad','2026-05-21 20:33:01',NULL,'2026-04-21 17:33:00');
INSERT INTO `refresh_tokens` VALUES (7,1,'7a6354561ddbf405a6647388eacdc05b291152b935eb118d54294a1831e4be08','2026-05-21 20:33:15',NULL,'2026-04-21 17:33:14');
INSERT INTO `refresh_tokens` VALUES (8,2,'60224df0b249cad965b074180e6510bda9c217fd51775df17c31661e7319f79f','2026-05-22 12:44:18','2026-04-22 12:44:31','2026-04-22 09:44:18');
INSERT INTO `refresh_tokens` VALUES (9,2,'c77550d344f564d10c662d82061f8a76ea9e13fe4a5bb12837e8a2c71edb0645','2026-05-22 12:50:03','2026-04-22 15:22:07','2026-04-22 09:50:03');
INSERT INTO `refresh_tokens` VALUES (10,2,'82355b9483d6c101cd3b8a2788f08c5ff13872ad3b0df5fb9472db7246e6f419','2026-05-22 15:22:08','2026-04-22 15:46:50','2026-04-22 12:22:07');
INSERT INTO `refresh_tokens` VALUES (11,2,'c4eb40c4cbe2a979b3ecc26716e3e9c1782b96ec955978e30b8874ab7cc8aa8f','2026-05-22 15:46:51','2026-04-22 15:56:02','2026-04-22 12:46:50');
INSERT INTO `refresh_tokens` VALUES (12,2,'4a47ac3b32a5fa22c7c0f95932fca413b3231ba941bcc1a3bce20039801f0d3e','2026-05-22 15:56:03','2026-04-22 15:58:38','2026-04-22 12:56:02');
INSERT INTO `refresh_tokens` VALUES (13,2,'2c674c030358a2d2f343734afad1303f27c797e21d218c099fa373ae5d3832c2','2026-05-22 15:58:39','2026-04-22 16:00:37','2026-04-22 12:58:38');
INSERT INTO `refresh_tokens` VALUES (14,2,'506bee7ef17515fbf1833da553fe9b1c3742181c6c3e7e66ddbdeb52317243ab','2026-05-22 16:00:37','2026-04-22 16:00:44','2026-04-22 13:00:37');
INSERT INTO `refresh_tokens` VALUES (15,2,'f0a80bd18d1402cfca61d89448f604bae82166459eb07050983de63802f43280','2026-05-22 16:00:44','2026-04-22 16:01:05','2026-04-22 13:00:44');
INSERT INTO `refresh_tokens` VALUES (16,2,'0a30232b880cc8b27d27d45f052d9406a51edfb7cd37f0a49dc5dedc71e47b29','2026-05-22 16:01:08','2026-04-22 16:01:24','2026-04-22 13:01:07');
INSERT INTO `refresh_tokens` VALUES (17,2,'07d2458a7ef7d889349acb3d5b41b55d1efdb39186a07edec06a30f8ba61e2ef','2026-05-22 16:01:24','2026-04-22 16:21:40','2026-04-22 13:01:24');
INSERT INTO `refresh_tokens` VALUES (18,2,'c6978f2e12bc0f406e16d2a001e505247f6e9d9034a49e449b31dc8272162546','2026-05-22 16:23:13',NULL,'2026-04-22 13:23:12');
INSERT INTO `refresh_tokens` VALUES (19,1,'c7ff70b72f1642b54aa8a69d821a31cbbe73c100894129b75d74f35b9336bb77','2026-05-23 14:13:26',NULL,'2026-04-23 11:13:26');
INSERT INTO `refresh_tokens` VALUES (20,1,'9d3c35e8f9bfa420916781cd759d6eb4572d3599926e52378413bccdd791d056','2026-05-23 14:20:28',NULL,'2026-04-23 11:20:28');
INSERT INTO `refresh_tokens` VALUES (21,1,'a1474d8b74b9407f6a4ca1564071f867a43739fc4f044227d3064a25a86a28df','2026-05-23 14:20:56',NULL,'2026-04-23 11:20:55');
INSERT INTO `refresh_tokens` VALUES (22,2,'771e0ca0d563c01af5bfcf46e125e7302072cd2b32850761bd7c8cfbc3fd8ed8','2026-05-23 14:25:16',NULL,'2026-04-23 11:25:16');
INSERT INTO `refresh_tokens` VALUES (23,2,'f69c7536c1f43283fa8387a3ba441358d5eb89607ad4b2e0c862288c60835443','2026-05-23 14:46:55','2026-04-23 14:47:57','2026-04-23 11:46:54');
INSERT INTO `refresh_tokens` VALUES (24,2,'40c774babb4317a81c4f44b4622bd0ff67dc9fa2af9e85e7293edcf11c0c3396','2026-05-23 14:48:01',NULL,'2026-04-23 11:48:00');
INSERT INTO `refresh_tokens` VALUES (25,2,'ca82edbddd79dd03fc2e9a7cac947147ea1148867922c85cc9d3a9d996a8e45f','2026-05-24 21:33:07',NULL,'2026-04-24 18:33:06');
INSERT INTO `refresh_tokens` VALUES (26,2,'e392701067fd7635a7d229135025eb6a007b2efd470a0cfcdbf203184a241269','2026-05-26 21:41:20',NULL,'2026-04-26 18:41:20');
INSERT INTO `refresh_tokens` VALUES (27,1,'6f0e89b50523abeda75ddbc4ac6dbd27ff8391f0e87c144922b3129adcf5948c','2026-05-26 23:01:36',NULL,'2026-04-26 20:01:36');
INSERT INTO `refresh_tokens` VALUES (28,2,'c16beb4005b549b3edba7ad9922e5692bf95fcdb2074aa4c22196ceeaa225440','2026-05-27 16:06:51',NULL,'2026-04-27 13:06:51');
INSERT INTO `refresh_tokens` VALUES (29,2,'59eeae14ea94a8c6b2c887187ffc37f44f0c50f6158c10724d119a1db7e67c4c','2026-05-28 17:26:20',NULL,'2026-04-28 14:26:19');
INSERT INTO `refresh_tokens` VALUES (30,2,'dd0bd2f41bf4c3c90c982379769c650f9cca40f0aa19cf59111b5e4ebd53b709','2026-06-04 17:58:54',NULL,'2026-05-05 14:58:53');
INSERT INTO `refresh_tokens` VALUES (31,3,'3746adca08c38809d2ae2a709f1cedcd8a202a2092747e020a664d74800afabb','2026-06-04 18:02:49','2026-05-26 13:25:43','2026-05-05 15:02:48');
INSERT INTO `refresh_tokens` VALUES (32,2,'5802a3e2c8995cb62d07768913105aaa7b948ac24f4cacb6bcc685d39ba40dc0','2026-06-11 12:50:56','2026-05-12 12:52:45','2026-05-12 09:50:55');
INSERT INTO `refresh_tokens` VALUES (33,2,'9499b60fc5179fdcd854b7bafba7c96bf24d9a22c12217bdad2955eedf155594','2026-06-11 12:53:03','2026-05-12 13:00:03','2026-05-12 09:53:02');
INSERT INTO `refresh_tokens` VALUES (34,2,'5d6e32e98fa7d5ebaa464b7dbdf0f352baf666cde44f1808d4352975bbc62a39','2026-06-14 11:34:37','2026-05-25 12:09:43','2026-05-15 08:34:37');
INSERT INTO `refresh_tokens` VALUES (35,1,'7250b2678e28ecc1d06fa5e4861f5866401aeb27c90efe666fb9aba8d2adae22','2026-06-14 12:03:19',NULL,'2026-05-15 09:03:19');
INSERT INTO `refresh_tokens` VALUES (36,2,'91ba5ba9d29965e5f732d56f42ee9900819b708d64715f7f0a2a9c5dbd281c85','2026-06-24 12:09:44','2026-05-25 12:09:48','2026-05-25 09:09:43');
INSERT INTO `refresh_tokens` VALUES (37,4,'8bb88417b951b53abc1fdf96dbb21bbc6717f909518a43c5a108fc82009879b9','2026-06-24 12:10:26','2026-05-25 12:14:02','2026-05-25 09:10:26');
INSERT INTO `refresh_tokens` VALUES (38,4,'88fae7f6540cd1e03d3aa73814fb09168dccc915072d67ac5ce20b6b370930af','2026-06-24 12:14:05',NULL,'2026-05-25 09:14:04');
INSERT INTO `refresh_tokens` VALUES (39,4,'accf7dc0888f628e01262176fef04ad6f1d2e7774e7d4c7c5df7492f65e2f6e8','2026-06-24 12:20:40','2026-05-25 12:21:28','2026-05-25 09:20:39');
INSERT INTO `refresh_tokens` VALUES (40,2,'d39212e99d2c995c0842cc6d5d74f60100077367fa2ca895f900167a09b3ab6a','2026-06-24 12:21:36','2026-05-25 12:33:19','2026-05-25 09:21:36');
INSERT INTO `refresh_tokens` VALUES (41,1,'abca6f0a0d38add788a3559f4706fa469a33d4e251b23ea52a619c84748a65b3','2026-06-24 12:31:42',NULL,'2026-05-25 09:31:42');
INSERT INTO `refresh_tokens` VALUES (42,4,'99b1b0c187058c63ce7531ce01ef4d3d4276d10a801112749786bbf24c343f88','2026-06-24 12:33:25','2026-05-25 14:25:13','2026-05-25 09:33:25');
INSERT INTO `refresh_tokens` VALUES (43,2,'db875cad649a09155e986d8c088ffce0dfbc83547ab277cacd465daf1508f92a','2026-06-24 14:25:23','2026-05-26 13:35:05','2026-05-25 11:25:22');
INSERT INTO `refresh_tokens` VALUES (44,3,'b320104edc472e7d0a53e5102a11223f3ebf56e1817b324b96ddbcfa7e0055b2','2026-06-25 13:25:44',NULL,'2026-05-26 10:25:43');
INSERT INTO `refresh_tokens` VALUES (45,1,'fd8fab2fa64e0d1eede3286f69c2b3993d6a4c9c76c37d9f5c4302540f544551','2026-06-25 13:28:52',NULL,'2026-05-26 10:28:52');
INSERT INTO `refresh_tokens` VALUES (46,1,'81dbed3f9238515c0334c3a9fe65ccdd9bcecdb118e5f960f0aa66a0b442e30f','2026-06-25 13:31:10',NULL,'2026-05-26 10:31:10');
INSERT INTO `refresh_tokens` VALUES (47,2,'38d1e30e9e1501c5474210ffcca1dd3846e2f307a8683fc9c39438de0b6e0f5b','2026-06-25 13:35:19','2026-05-28 14:54:02','2026-05-26 10:35:19');
/*!40000 ALTER TABLE `refresh_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reservation_seats`
--

DROP TABLE IF EXISTS `reservation_seats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservation_seats` (
  `reservation_seat_id` int NOT NULL AUTO_INCREMENT,
  `reservation_id` int NOT NULL,
  `showtime_id` int NOT NULL,
  `seat_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`reservation_seat_id`),
  UNIQUE KEY `uq_showtime_seat` (`showtime_id`,`seat_id`),
  KEY `fk_rs_reservation` (`reservation_id`),
  KEY `fk_rs_seat` (`seat_id`),
  CONSTRAINT `fk_rs_reservation` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`reservation_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rs_seat` FOREIGN KEY (`seat_id`) REFERENCES `seats` (`seat_id`),
  CONSTRAINT `fk_rs_showtime` FOREIGN KEY (`showtime_id`) REFERENCES `showtimes` (`showtime_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservation_seats`
--

LOCK TABLES `reservation_seats` WRITE;
/*!40000 ALTER TABLE `reservation_seats` DISABLE KEYS */;
INSERT INTO `reservation_seats` VALUES (2,2,37,1,'2026-04-19 17:28:39');
INSERT INTO `reservation_seats` VALUES (7,3,1,20,'2026-04-21 19:22:00');
INSERT INTO `reservation_seats` VALUES (8,3,1,26,'2026-04-21 19:22:00');
INSERT INTO `reservation_seats` VALUES (9,4,1,3,'2026-04-22 14:23:53');
INSERT INTO `reservation_seats` VALUES (10,4,1,12,'2026-04-22 14:23:53');
INSERT INTO `reservation_seats` VALUES (11,5,37,22,'2026-04-22 15:56:52');
INSERT INTO `reservation_seats` VALUES (12,1,37,2,'2026-04-22 16:00:26');
INSERT INTO `reservation_seats` VALUES (13,1,37,23,'2026-04-22 16:00:26');
INSERT INTO `reservation_seats` VALUES (14,6,1,1,'2026-04-22 16:01:17');
INSERT INTO `reservation_seats` VALUES (15,7,2,1,'2026-04-23 10:01:53');
INSERT INTO `reservation_seats` VALUES (16,8,13,1,'2026-04-23 10:04:17');
INSERT INTO `reservation_seats` VALUES (17,9,13,2,'2026-04-27 07:52:42');
INSERT INTO `reservation_seats` VALUES (18,10,22,5,'2026-05-25 09:14:38');
INSERT INTO `reservation_seats` VALUES (19,11,22,6,'2026-05-25 09:22:15');
/*!40000 ALTER TABLE `reservation_seats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reservations`
--

DROP TABLE IF EXISTS `reservations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reservations` (
  `reservation_id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `showtime_id` int NOT NULL,
  `booking_code` varchar(60) NOT NULL,
  `status` enum('pending','confirmed','cancelled') NOT NULL DEFAULT 'confirmed',
  `expires_at` datetime DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `card_last4` varchar(4) DEFAULT NULL,
  `promo_id` int DEFAULT NULL,
  `promo_code` varchar(80) DEFAULT NULL,
  `discount_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `final_price` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ticket_token` varchar(120) DEFAULT NULL,
  `checked_in_at` datetime DEFAULT NULL,
  PRIMARY KEY (`reservation_id`),
  UNIQUE KEY `booking_code` (`booking_code`),
  KEY `fk_res_user` (`user_id`),
  KEY `fk_res_showtime` (`showtime_id`),
  KEY `fk_res_promo` (`promo_id`),
  CONSTRAINT `fk_res_promo` FOREIGN KEY (`promo_id`) REFERENCES `promo_codes` (`promo_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_res_showtime` FOREIGN KEY (`showtime_id`) REFERENCES `showtimes` (`showtime_id`),
  CONSTRAINT `fk_res_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservations`
--

LOCK TABLES `reservations` WRITE;
/*!40000 ALTER TABLE `reservations` DISABLE KEYS */;
INSERT INTO `reservations` VALUES (1,2,37,'BK-1776611625630-591','cancelled',NULL,'card_demo','1223',2,'SAVE5',5.00,45.00,'2026-04-19 15:13:45',NULL,NULL);
INSERT INTO `reservations` VALUES (2,3,37,'BK-1776619719958-58','confirmed',NULL,'card_demo','1111',3,'SUMMER5',1.40,26.60,'2026-04-19 17:28:39',NULL,NULL);
INSERT INTO `reservations` VALUES (3,2,1,'BK-1776627121057-447','cancelled',NULL,'card_demo','1234',2,'SAVE5',5.00,39.00,'2026-04-19 19:32:01',NULL,NULL);
INSERT INTO `reservations` VALUES (4,2,1,'BK-1776867833817-156','cancelled',NULL,'card_demo','1234',3,'SUMMER5',2.80,53.20,'2026-04-22 14:23:53','23e8f83fdb9117fddbfd0fcc1566b0bc025e18796fcbd9d9',NULL);
INSERT INTO `reservations` VALUES (5,2,37,'BK-1776873412544-789','cancelled',NULL,'counter',NULL,NULL,NULL,0.00,22.00,'2026-04-22 15:56:52','82d66d9a17d0254f84f8accc4c2b164791ab880ec3ba1726',NULL);
INSERT INTO `reservations` VALUES (6,2,1,'BK-1776873677888-828','confirmed',NULL,'counter',NULL,NULL,NULL,0.00,28.00,'2026-04-22 16:01:17','aeafb37570b56dd29081dac50059fe7da1135f4d7c88ed6e',NULL);
INSERT INTO `reservations` VALUES (7,2,2,'BK-1776938513632-778','confirmed',NULL,'counter',NULL,NULL,NULL,0.00,28.00,'2026-04-23 10:01:53','88dfd1df5b2bfc75095c61bd79ee07bb65e88b12073eeb07',NULL);
INSERT INTO `reservations` VALUES (8,2,13,'BK-1776938657524-782','confirmed',NULL,'counter',NULL,NULL,NULL,0.00,28.00,'2026-04-23 10:04:17','53acff4089a8c453ea3fd1a106b67a3fd2a77947543bc802',NULL);
INSERT INTO `reservations` VALUES (9,2,13,'BK-1777276362215-502','confirmed',NULL,'card_demo','4567',3,'SUMMER5',1.40,26.60,'2026-04-27 07:52:42','891b4220e21c5ab813b3fad654d7dbc854a4f139fe8c84c0',NULL);
INSERT INTO `reservations` VALUES (10,4,22,'BK-1779700477996-557','confirmed',NULL,'counter',NULL,NULL,NULL,0.00,28.00,'2026-05-25 09:14:37','e28e35294dfcfc7f5d207567e799167dc7b9c31fee11b62b',NULL);
INSERT INTO `reservations` VALUES (11,2,22,'BK-1779700935820-488','confirmed',NULL,'card_demo','1212',NULL,NULL,0.00,28.00,'2026-05-25 09:22:15','5ac5c6d91019f89f4fcfe243962a2f47749850710786fb71',NULL);
/*!40000 ALTER TABLE `reservations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `seats`
--

DROP TABLE IF EXISTS `seats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `seats` (
  `seat_id` int NOT NULL AUTO_INCREMENT,
  `row_label` char(1) NOT NULL,
  `seat_number` int NOT NULL,
  `category` enum('VIP','Regular','Economy') NOT NULL DEFAULT 'Regular',
  PRIMARY KEY (`seat_id`),
  UNIQUE KEY `uq_seat` (`row_label`,`seat_number`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `seats`
--

LOCK TABLES `seats` WRITE;
/*!40000 ALTER TABLE `seats` DISABLE KEYS */;
INSERT INTO `seats` VALUES (1,'A',1,'VIP');
INSERT INTO `seats` VALUES (2,'A',2,'VIP');
INSERT INTO `seats` VALUES (3,'A',3,'VIP');
INSERT INTO `seats` VALUES (4,'A',4,'VIP');
INSERT INTO `seats` VALUES (5,'A',5,'VIP');
INSERT INTO `seats` VALUES (6,'A',6,'VIP');
INSERT INTO `seats` VALUES (7,'A',7,'VIP');
INSERT INTO `seats` VALUES (8,'A',8,'VIP');
INSERT INTO `seats` VALUES (9,'B',1,'VIP');
INSERT INTO `seats` VALUES (10,'B',2,'VIP');
INSERT INTO `seats` VALUES (11,'B',3,'VIP');
INSERT INTO `seats` VALUES (12,'B',4,'VIP');
INSERT INTO `seats` VALUES (13,'B',5,'VIP');
INSERT INTO `seats` VALUES (14,'B',6,'VIP');
INSERT INTO `seats` VALUES (15,'B',7,'VIP');
INSERT INTO `seats` VALUES (16,'B',8,'VIP');
INSERT INTO `seats` VALUES (17,'C',1,'Regular');
INSERT INTO `seats` VALUES (18,'C',2,'Regular');
INSERT INTO `seats` VALUES (19,'C',3,'Regular');
INSERT INTO `seats` VALUES (20,'C',4,'Regular');
INSERT INTO `seats` VALUES (21,'C',5,'Regular');
INSERT INTO `seats` VALUES (22,'C',6,'Regular');
INSERT INTO `seats` VALUES (23,'C',7,'Regular');
INSERT INTO `seats` VALUES (24,'C',8,'Regular');
INSERT INTO `seats` VALUES (25,'D',1,'Regular');
INSERT INTO `seats` VALUES (26,'D',2,'Regular');
INSERT INTO `seats` VALUES (27,'D',3,'Regular');
INSERT INTO `seats` VALUES (28,'D',4,'Regular');
INSERT INTO `seats` VALUES (29,'D',5,'Regular');
INSERT INTO `seats` VALUES (30,'D',6,'Regular');
INSERT INTO `seats` VALUES (31,'D',7,'Regular');
INSERT INTO `seats` VALUES (32,'D',8,'Regular');
INSERT INTO `seats` VALUES (33,'E',1,'Economy');
INSERT INTO `seats` VALUES (34,'E',2,'Economy');
INSERT INTO `seats` VALUES (35,'E',3,'Economy');
INSERT INTO `seats` VALUES (36,'E',4,'Economy');
INSERT INTO `seats` VALUES (37,'E',5,'Economy');
INSERT INTO `seats` VALUES (38,'E',6,'Economy');
INSERT INTO `seats` VALUES (39,'E',7,'Economy');
INSERT INTO `seats` VALUES (40,'E',8,'Economy');
INSERT INTO `seats` VALUES (41,'F',1,'Economy');
INSERT INTO `seats` VALUES (42,'F',2,'Economy');
INSERT INTO `seats` VALUES (43,'F',3,'Economy');
INSERT INTO `seats` VALUES (44,'F',4,'Economy');
INSERT INTO `seats` VALUES (45,'F',5,'Economy');
INSERT INTO `seats` VALUES (46,'F',6,'Economy');
INSERT INTO `seats` VALUES (47,'F',7,'Economy');
INSERT INTO `seats` VALUES (48,'F',8,'Economy');
/*!40000 ALTER TABLE `seats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `show_reviews`
--

DROP TABLE IF EXISTS `show_reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `show_reviews` (
  `review_id` int NOT NULL AUTO_INCREMENT,
  `show_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `reviewer_name` varchar(160) NOT NULL,
  `reviewer_email` varchar(190) DEFAULT NULL,
  `rating` tinyint NOT NULL,
  `title` varchar(160) DEFAULT NULL,
  `comment` text NOT NULL,
  `status` enum('approved','hidden') NOT NULL DEFAULT 'approved',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`review_id`),
  KEY `fk_show_reviews_show` (`show_id`),
  KEY `fk_show_reviews_user` (`user_id`),
  CONSTRAINT `fk_show_reviews_show` FOREIGN KEY (`show_id`) REFERENCES `shows` (`show_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_show_reviews_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `show_reviews`
--

LOCK TABLES `show_reviews` WRITE;
/*!40000 ALTER TABLE `show_reviews` DISABLE KEYS */;
INSERT INTO `show_reviews` VALUES (1,1,2,'Anastasis D','periergos122@gmail.com',5,'τεστεττετετε','ααλαλλσξκσλαξσαλσ','approved','2026-04-22 13:05:29','2026-04-22 13:05:29');
/*!40000 ALTER TABLE `show_reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shows`
--

DROP TABLE IF EXISTS `shows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shows` (
  `show_id` int NOT NULL AUTO_INCREMENT,
  `theatre_id` int NOT NULL,
  `title` varchar(150) NOT NULL,
  `genre` varchar(80) DEFAULT NULL,
  `description` text,
  `duration_minutes` int NOT NULL,
  `age_rating` varchar(20) DEFAULT NULL,
  `poster_url` varchar(255) DEFAULT NULL,
  `hero_image_url` varchar(500) DEFAULT NULL,
  `trailer_url` varchar(1000) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `overview_text` text,
  `cast_text` text,
  `creatives_text` text,
  `highlights_text` text,
  `audience_text` text,
  `content_warnings_text` text,
  PRIMARY KEY (`show_id`),
  KEY `fk_shows_theatre` (`theatre_id`),
  CONSTRAINT `fk_shows_theatre` FOREIGN KEY (`theatre_id`) REFERENCES `theatres` (`theatre_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shows`
--

LOCK TABLES `shows` WRITE;
/*!40000 ALTER TABLE `shows` DISABLE KEYS */;
INSERT INTO `shows` VALUES (1,1,'Φάουστ','Δράμα','Η βασισμένη στον Φάουστ του Γιόχαν Βόλφγκανγκ φον Γκαίτε παράσταση επιστρέφει στο Εθνικό Θέατρο σε σκηνοθεσία Άρη Μπινιάρη. Μια σκοτεινή, μουσική και υπαρξιακή σκηνική εμπειρία γύρω από τη γνώση, την επιθυμία, τα ηθικά διλήμματα και την αναζήτηση νοήματος.',90,'16+','/uploads/1777533935426-979513613.jpg','/uploads/1777533961045-141887833.jpeg',NULL,'2026-04-19 14:13:59','Μια παράσταση που μεταφέρει τον μύθο του Φάουστ στο σήμερα, μέσα από μια αγωνιώδη κατάδυση στο υποσυνείδητο, στο σώμα, στη γνώση και στις σκοτεινές περιοχές της ανθρώπινης επιθυμίας.','Δημήτρης Ήμελλος — Φάουστ\nΜαρία Κίτσου — Μαργαρίτα\nΑναστάσης Ροϊλός — Μεφιστοφελής','Μετάφραση: Ιωάννης Ν. Θεοδωρακόπουλος\nΔιασκευή, σκηνοθεσία: Άρης Μπινιάρης\nΣκηνικά, κοστούμια, μάσκες: Πάρις Μέξης\nΜουσική, ηχητικός σχεδιασμός: Τζεφ Βάγγερ\nΧορογραφία: Φαίδρα Νταϊόγλου\nΦωτισμοί: Στέλλα Κάλτσου','Σύγχρονη σκηνική ανάγνωση ενός κλασικού έργου\nΈντονη μουσικότητα και σκοτεινή ατμόσφαιρα\nΣκηνοθεσία Άρη Μπινιάρη\nΙδανικό για κοινό που αγαπά το απαιτητικό ψυχολογικό θέατρο','Προτείνεται για θεατές άνω των 16 ετών και για κοινό που ενδιαφέρεται για κλασικά έργα σε σύγχρονη, σωματική και μουσική σκηνική γλώσσα.','Σκοτεινή υπαρξιακή ατμόσφαιρα\nΘεματικές ηθικής σύγκρουσης\nΨυχολογική ένταση\nΚατάλληλο για θεατές άνω των 16 ετών');
INSERT INTO `shows` VALUES (2,1,'Ο Βυσσινόκηπος','Δράμα','Το τελευταίο μεγάλο έργο του Άντον Τσέχωφ παρουσιάζεται στο Εθνικό Θέατρο σε διασκευή και σκηνοθεσία Έκτορα Λυγίζου. Μια οικογένεια επιστρέφει στο υποθηκευμένο σπίτι της, ενώ ο βυσσινόκηπος γίνεται σύμβολο ενός κόσμου που χάνεται.',130,'12+','/uploads/1777534938514-875276951.jpg','/uploads/1777534960129-620738833.webp',NULL,'2026-04-19 14:13:59','Μια παράσταση για τη μνήμη, την αλλαγή και την αδυναμία των ανθρώπων να αποχωριστούν το παρελθόν τους. Ο βυσσινόκηπος γίνεται ο χώρος όπου συγκρούονται η νοσταλγία, η κοινωνική μεταβολή και το τέλος μιας εποχής.','Γιώργος Ζιάκας — Γιάσα\nΓιάννης Κλίνης — Λεονίντ Αντρέγεβιτς Γκάγεφ\nΣοφία Κόκκαλη — Βάρια\nΈκτορας Λυγίζος — Ερμολάι Αλεξέγεβιτς Λοπάχιν\nΥβόννη Μαλτέζου — Κυρία Φιρς\nΡάνια Οικονομίδου — Κυρία Φιρς\nΑμαλία Μουτούση — Λιουμπόφ Αντρέγιεβνα','Συγγραφέας: Άντον Τσέχωφ\nΜετάφραση: Χρύσα Προκοπάκη\nΔιασκευή, σκηνοθεσία: Έκτορας Λυγίζος\nΣκηνικά: Μυρτώ Λάμπρου\nΚοστούμια: Άλκηστη Μάμαλη\nΠρωτότυπη μουσική, μουσική προσαρμογή: Λίνα Ζάχαρη','Κλασικό έργο του Τσέχωφ\nΣκηνοθεσία Έκτορα Λυγίζου\nΔιάρκεια 130 λεπτά χωρίς διάλειμμα\nΘέατρο χαρακτήρων με χιούμορ, μελαγχολία και κοινωνικό βάθος','Κατάλληλο για θεατές που αγαπούν το κλασικό δραματικό ρεπερτόριο, τις ιστορίες μνήμης και τα έργα με λεπτό ψυχολογικό και κοινωνικό σχόλιο.','Θεματικές απώλειας και κοινωνικής αλλαγής\nΜελαγχολική ατμόσφαιρα\nΟικογενειακή ένταση');
INSERT INTO `shows` VALUES (3,2,'Κουκλίτσα','Δράμα','Μια παράσταση βασισμένη στο Κουκλόσπιτο του Ίψεν, σε σκηνοθεσία Μαρίας Πανουργιά. Το έργο επιστρέφει στο εμβληματικό σπίτι της Νόρας για να μιλήσει για τη γυναικεία χειραγώγηση, την οικονομική εξάρτηση, την ελευθερία και τη ρήξη.',105,'15+','/uploads/1777534834301-919169268.jpg','/uploads/1777534847451-416178144.jpeg',NULL,'2026-04-19 14:13:59','Μια σκοτεινή, καυστική και σύγχρονη επίσκεψη στο Κουκλόσπιτο. Η Νόρα δεν φεύγει απλώς από ένα σπίτι, αλλά διεκδικεί την επιλογή, την ευθύνη και το δικαίωμα να ονειρεύεται έναν διαφορετικό κόσμο.','Άρης Αρμαγανίδης — Δρ. Ρανκ\nΣτέλλα Βογιατζάκη — Νόρα Χέλμερ\nΜπάμπης Γαλιατσάτος — Κρόγκσταντ\nΕλεάνα Γεωργούλη — Κριστίνε Λίντε\nΧριστιάνα Ματέλσκα — Τόκα, υπηρέτρια, κουβερνάντα\nΦιντέλ Ταλαμπούκας — Τόρβαλντ Χέλμερ','Βασισμένο στο Κουκλόσπιτο του Ίψεν\nΜετάφραση: Γιώργος Π. Δεπάστας\nΔραματουργική επεξεργασία, σκηνοθεσία, σκηνικά: Μαρία Πανουργιά\nΣύμβουλος δραματουργίας: Αντώνης Αντωνόπουλος\nΚοστούμια: Ιωάννα Τσάμη\nΜουσική: Γιώργος Μιζήθρας','Σύγχρονη ανάγνωση του Κουκλόσπιτου\nΙσχυρό γυναικείο κέντρο\nΘέματα ελευθερίας, χρήματος και χειραγώγησης\nΠαράσταση με καυστικό χιούμορ και σκοτεινή ένταση','Κατάλληλη για κοινό που ενδιαφέρεται για σύγχρονη δραματουργική ανάγνωση κλασικών έργων και για παραστάσεις με κοινωνικό και φεμινιστικό προβληματισμό.','Θεματικές χειραγώγησης\nΟικονομική και ψυχολογική πίεση\nΣκοτεινή δραματική ατμόσφαιρα\nΚατάλληλο για ώριμο εφηβικό και ενήλικο κοινό');
INSERT INTO `shows` VALUES (4,2,'Τρεις αδελφές','Δράμα','Το αριστούργημα του Άντον Τσέχωφ επιστρέφει στο Εθνικό Θέατρο σε σκηνοθεσία Μαρίας Μαγκανάρη. Μια παράσταση για την προσδοκία, τον χρόνο, τη μνήμη και την αναζήτηση μιας Μόσχας που βρίσκεται πάντα εκεί όπου δεν είμαστε.',127,'12+','/uploads/1777535165759-782880280.jpg','/uploads/1777535180560-455379246.jpg',NULL,'2026-04-19 14:13:59','Μια παράσταση για ανθρώπους που λαχταρούν να γίνουν μια καλύτερη εκδοχή του εαυτού τους αλλά παραμένουν παγιδευμένοι στον χρόνο, στη μνήμη και στις ανεκπλήρωτες επιθυμίες τους.','Μαρία Γεωργιάδου — Νατάσα\nΘανάσης Δήμου — Κουλίγκιν\nΑμαλία Καβάλη — Όλγα\nΓιάννης Κλίνης — Αντρέι\nΝάνσυ Σιδέρη — Ιρίνα\nΜαρία Σκουλά — Μάσα\nΓιωργής Τσαμπουράκης — Βερσίνιν','Συγγραφέας: Άντον Τσέχωφ\nΜετάφραση: Γιώργος Π. Δεπάστας, Αλέξανδρος Ίσαρης\nΣκηνοθεσία: Μαρία Μαγκανάρη\nΣύμβουλος δραματουργίας: Σοφία Ευτυχιάδου\nΣκηνικά: Φιλάνθη Μπουγάτσου\nΚοστούμια: Παύλος Θανόπουλος\nΜουσική: Χαράλαμπος Γωγιός','Έργο κορυφής του Τσέχωφ\nΣκηνοθεσία Μαρίας Μαγκανάρη\nΔυνατό ensemble\nΘέατρο μνήμης, χρόνου και ανεκπλήρωτης επιθυμίας','Κατάλληλη για θεατές που αγαπούν το κλασικό δραματικό θέατρο, το θέατρο χαρακτήρων και τις παραστάσεις που δουλεύουν με λεπτές ψυχολογικές αποχρώσεις.','Μελαγχολική ατμόσφαιρα\nΘεματικές ματαίωσης και φθοράς\nΟικογενειακή και ψυχολογική ένταση');
INSERT INTO `shows` VALUES (5,3,'Η Καρυάτιδα!','Κωμωδία','Το έργο του Γιώργου Καπουτζίδη συνεχίζεται για δεύτερο χρόνο στο Θέατρο Κάππα. Μια σύγχρονη κωμωδία με κοινωνική ευαισθησία, χιούμορ και καθαρό βλέμμα πάνω στην ταυτότητα, την αποδοχή και τις ανθρώπινες σχέσεις.',100,'12+','/uploads/1777534728630-676165019.jpg','/uploads/1777534744521-378013479.jpg',NULL,'2026-04-19 14:13:59','Μια παράσταση που αξιοποιεί το γνώριμο χιούμορ του Γιώργου Καπουτζίδη για να μιλήσει για την κοινωνία, την αποδοχή, τα στερεότυπα και την ανάγκη να σταθεί κανείς με ειλικρίνεια απέναντι στον εαυτό του.','Ασημίνα Αναστασοπούλου — Βιολέτα\nΣτέλιος Ιακωβίδης — Παναγιώτης\nΣωτήρης Μανίκας — Γιώργος\nΣτέλιος Ξανθουδάκης — Πρωθυπουργός\nΑγορίτσα Οικονόμου — Αλεξάνδρα Βελλή\nΔρόσος Σκώτης — Κοσμάς Σιδέρης\nΜαρία Φιλίνη — Μαριέττα Λαγκάδη','Συγγραφέας: Γιώργος Καπουτζίδης\nΣκηνοθεσία: Κατερίνα Μαυρογεώργη\nΣύμβουλος δραματουργίας, καλλιτεχνικός συνεργάτης: Αντώνης Αντωνόπουλος\nΣκηνικά: Άρτεμις Φλέσσα\nΚοστούμια: Ιφιγένεια Νταουντάκη\nΜουσική: Larry Gus\nΚίνηση: Σοφία Πάσχου','Κείμενο Γιώργου Καπουτζίδη\nΣύγχρονη ελληνική κωμωδία\nΧιούμορ με κοινωνική ευαισθησία\nΔιάρκεια 100 λεπτά','Κατάλληλη για θεατές που αγαπούν τη σύγχρονη ελληνική κωμωδία, το θέατρο σχέσεων και τα έργα που συνδυάζουν χιούμορ με κοινωνικό προβληματισμό.','Κοινωνικά θέματα και στερεότυπα\nΉπιο κωμικό περιεχόμενο\nΚατάλληλο για εφηβικό και ενήλικο κοινό');
INSERT INTO `shows` VALUES (6,3,'Kontakthof','Χορός','Το εμβληματικό έργο της Pina Bausch παρουσιάζεται στο Εθνικό Θέατρο σε σύμπραξη με το Pina Bausch Foundation. Μια σκηνική αναβίωση για την ανάγκη επαφής, την επιθυμία, την ανασφάλεια, την οικειότητα και τη μοναξιά.',170,'12+','/uploads/1777533762319-955779973.webp','/uploads/1777533782780-716799484.jpg',NULL,'2026-04-19 14:13:59','Ένας τόπος όπου άνθρωποι συναντιούνται αναζητώντας επαφή. Το έργο αποκαλύπτει επιθυμίες, φόβους, απογοητεύσεις, τρυφερότητα και τη βαθιά ανάγκη του ανθρώπου για επικοινωνία.','22 ερμηνευτές και ερμηνεύτριες από την Ελλάδα\nΣκηνική αναβίωση με καλλιτεχνική διεύθυνση Josephine Ann Endicott και Δάφνι Κόκκινου\nΣυνεργασία με Anne Martin και Scott Jennings','Σκηνοθεσία, χορογραφία: Pina Bausch\nΣυνεργασία: Rolf Borzik, Marion Cito, Hans Pop\nΣκηνικά, κοστούμια: Rolf Borzik\nΜουσική: Charlie Chaplin, Anton Karas, Juan Llossas, Nino Rota, Jean Sibelius κ.ά.\nΣύμπραξη: Εθνικό Θέατρο και Pina Bausch Foundation','Εμβληματικό έργο της Pina Bausch\nΣκηνική αναβίωση με 22 ερμηνευτές\nΘέατρο χορού για την επαφή και την ανθρώπινη επιθυμία\nΔιάρκεια 2 ώρες και 50 λεπτά με διάλειμμα','Κατάλληλο για θεατές που αγαπούν το σύγχρονο χοροθέατρο, την Pina Bausch και τις παραστάσεις που δουλεύουν με σώμα, μνήμη, επιθυμία και ανθρώπινες σχέσεις.','Θεματικές επιθυμίας και μοναξιάς\nΣωματική και συναισθηματική ένταση\nΜεγάλη διάρκεια παράστασης');
INSERT INTO `shows` VALUES (7,4,'ΑΝΤΙΓΟΝΗ σε σκηνοθεσία Γιώργου Κουτλή','Τραγωδία','Μια σύγχρονη σκηνική προσέγγιση της Αντιγόνης, εμπνευσμένη από την τραγωδία του Σοφοκλή και τη ζωντανή διαδικασία των προβών. Η παράσταση παρουσιάζεται στο Θέατρο Κιβωτός σε σκηνοθεσία Γιώργου Κουτλή.',90,'12+','https://images.unsplash.com/photo-1741126182820-30b1356211ef?auto=format&fit=crop&w=900&q=80','https://images.unsplash.com/photo-1663139708711-7005beae41f0?auto=format&fit=crop&w=1600&q=80',NULL,'2026-04-19 14:13:59','Μια παράσταση για τη σύγκρουση ανάμεσα στον νόμο της εξουσίας και στην προσωπική συνείδηση. Η Αντιγόνη γίνεται αφετηρία για μια ζωντανή θεατρική συνομιλία με το σήμερα.','Η διανομή ακολουθεί την επίσημη παραγωγή της παράστασης στο Θέατρο Κιβωτός.','Βασισμένο στην Αντιγόνη του Σοφοκλή\nΣκηνοθεσία: Γιώργος Κουτλής\nΧώρος παρουσίασης: Θέατρο Κιβωτός\nΠηγή στοιχείων: more.com','Σύγχρονη ανάγνωση της Αντιγόνης\nΣκηνοθεσία Γιώργου Κουτλή\nΔιάρκεια 90 λεπτά\nΠαραστάσεις Μαΐου 2026','Κατάλληλη για κοινό που αγαπά την αρχαία τραγωδία σε σύγχρονη θεατρική γλώσσα και ενδιαφέρεται για ζητήματα εξουσίας, δικαιοσύνης και προσωπικής ευθύνης.','Θεματικές θανάτου και πένθους\nΣύγκρουση με την εξουσία\nΈντονη δραματική φόρτιση');
INSERT INTO `shows` VALUES (8,4,'170 τετραγωνικά','Κοινωνικό δράμα','Το έργο του Γιωργή Τσουρή συνεχίζεται για 7ο χρόνο στο Θέατρο Νέος Ακάδημος. Ένα οικογενειακό ρινγκ 170 τετραγωνικών, όπου το χιούμορ, η αγωνία και ο σκληρός ρεαλισμός συναντιούνται σε μια ιστορία ανθρώπων της διπλανής πόρτας.',95,'12+','/uploads/1777480330279-888689396.webp','/uploads/1777480468483-53702144.jpg',NULL,'2026-04-19 14:13:59','Μια νεοελληνική οικογενειακή ιστορία με χιούμορ, δράση και σκληρό ρεαλισμό. Το σπίτι γίνεται πεδίο σύγκρουσης, αποκάλυψης και συναισθηματικής έκρηξης.','Ήβη Νικολαΐδου\nΦώτης Λαζάρου\nΛυδία Γιαννουσάκη\nΗ υπόλοιπη διανομή ακολουθεί την επίσημη παραγωγή','Συγγραφέας: Γιωργής Τσουρής\nΣκηνοθεσία: Γιώργος Παλούμπης\nΧώρος παρουσίασης: Νέος Ακάδημος\nΠηγή στοιχείων: more.com','7ος χρόνος επιτυχίας\nΣύγχρονο νεοελληνικό έργο\nΟικογενειακή ένταση με χιούμορ και ρεαλισμό\nΔιάρκεια περίπου 95 λεπτά','Κατάλληλη για θεατές που αγαπούν το σύγχρονο ελληνικό θέατρο, τις οικογενειακές ιστορίες και τα έργα που ισορροπούν ανάμεσα στο γέλιο και τη δραματική ένταση.','Οικογενειακή ένταση\nΣκληρός ρεαλισμός\nΣυναισθηματικές συγκρούσεις');
INSERT INTO `shows` VALUES (9,5,'Ο Φονιάς - Έγκλημα και Αθώωση','Δράμα','Μια θεατρική παραγωγή σε σκηνοθεσία Πυγμαλίωνα Δαδακαρίδη, βασισμένη σε ιστορία εγκλήματος, ενοχής και αθώωσης. Η παράσταση παρουσιάζεται στο Δημοτικό Θέατρο Πειραιά και έχει διάρκεια περίπου 90 λεπτά.',90,'15+','/uploads/1777535108868-251033931.png','/uploads/1777535131269-252766325.jpg',NULL,'2026-04-19 14:13:59','Μια σκοτεινή θεατρική ιστορία γύρω από την ενοχή, την αλήθεια, τη δικαιοσύνη και την ανθρώπινη ευθύνη. Το έγκλημα γίνεται αφετηρία για μια σκηνική διερεύνηση της αθώωσης και των ορίων της.','Η διανομή ακολουθεί την επίσημη παραγωγή.','Σκηνοθεσία: Πυγμαλίων Δαδακαρίδης\nΧώρος παρουσίασης: Δημοτικό Θέατρο Πειραιά\nΠηγή στοιχείων: more.com','Σκηνοθεσία Πυγμαλίωνα Δαδακαρίδη\nΘέμα εγκλήματος και αθώωσης\nΔραματική ατμόσφαιρα\nΔιάρκεια 90 λεπτά','Κατάλληλη για κοινό που αγαπά το δραματικό θέατρο, τις ιστορίες μυστηρίου και τις παραστάσεις με ηθικά διλήμματα.','Θεματικές εγκλήματος\nΨυχολογική ένταση\nΣκοτεινή δραματική ατμόσφαιρα');
INSERT INTO `shows` VALUES (10,5,'Γέρμα η ανεκπλήρωτη','Δράμα','Η Γέρμα του Φεδερίκο Γκαρθία Λόρκα παρουσιάζεται σε σκηνοθεσία Μαρίας Πρωτόπαππα. Μια συμπυκνωμένη σκηνική εμπειρία γύρω από την επιθυμία, τη σιωπή, την κοινωνική πίεση και την ανεκπλήρωτη μητρότητα.',60,'15+','/uploads/1777534604555-995749383.jpg','/uploads/1777534619436-240573604.jpg',NULL,'2026-04-19 14:13:59','Μια παράσταση που φωτίζει τον λυρικό και επώδυνο κόσμο του Λόρκα, με κέντρο μια γυναίκα που συνθλίβεται ανάμεσα στην επιθυμία, στο κοινωνικό βλέμμα και στην αδυναμία εκπλήρωσης.','Η διανομή ακολουθεί την επίσημη παραγωγή του Βασιλικού Θεάτρου.','Συγγραφέας: Φεδερίκο Γκαρθία Λόρκα\nΣκηνοθεσία: Μαρία Πρωτόπαππα\nΧώρος παρουσίασης: Βασιλικό Θέατρο\nΠηγή στοιχείων: more.com','Λόρκα σε σύγχρονη σκηνική προσέγγιση\nΣκηνοθεσία Μαρίας Πρωτόπαππα\nΣυμπυκνωμένη διάρκεια 60 λεπτών\nΘέμα επιθυμίας, κοινωνικής πίεσης και ανεκπλήρωτης ζωής','Κατάλληλη για θεατές που αγαπούν το ποιητικό δράμα, τον Λόρκα και τις παραστάσεις με έντονο εσωτερικό και κοινωνικό βάρος.','Θεματικές μητρότητας και κοινωνικής πίεσης\nΈντονη συναισθηματική φόρτιση\nΠοιητική αλλά σκοτεινή ατμόσφαιρα');
INSERT INTO `shows` VALUES (11,6,'Λυσιστράτη','Κωμωδία','Η Λυσιστράτη του Αριστοφάνη παρουσιάζεται στο Αρχαίο Θέατρο Επιδαύρου το καλοκαίρι του 2026. Μια πολιτική και ανθρωποκεντρική κωμωδία για τον πόλεμο, τον έρωτα και την ανάγκη μιας κοινωνίας να βρει νέο τρόπο οργάνωσης.',120,'12+','/uploads/1777534175401-517828800.jpeg','/uploads/1777534200388-876014318.jpg',NULL,'2026-04-19 14:13:59','Η Λυσιστράτη δεν είναι μόνο μια κωμωδία για τον πόλεμο και τον έρωτα. Είναι ένα πολιτικό έργο για την εξάντληση μιας κοινωνίας και την ανάγκη να επινοηθεί ένας άλλος τρόπος συνύπαρξης.','Η διανομή ακολουθεί την επίσημη παραγωγή του Κρατικού Θεάτρου Βορείου Ελλάδος.','Συγγραφέας: Αριστοφάνης\nΠαραγωγή: Κρατικό Θέατρο Βορείου Ελλάδος\nΚαλλιτεχνική διεύθυνση παραγωγής: Αστέριος Πελτέκης\nΧώρος παρουσίασης: Αρχαίο Θέατρο Επιδαύρου\nΠηγή στοιχείων: Φεστιβάλ Αθηνών Επιδαύρου','Αριστοφανική κωμωδία στο Αρχαίο Θέατρο Επιδαύρου\nΠαραστάσεις 21 και 22 Αυγούστου 2026\nΠολιτικό και ανθρωποκεντρικό έργο\nΔιάρκεια περίπου 120 λεπτά','Κατάλληλη για θεατές που αγαπούν την αρχαία κωμωδία, το πολιτικό χιούμορ και τις καλοκαιρινές παραστάσεις στην Επίδαυρο.','Πολιτική σάτιρα\nΣεξουαλικά υπονοούμενα αριστοφανικού τύπου\nΘεματικές πολέμου');
INSERT INTO `shows` VALUES (12,6,'Άλκηστις','Τραγωδία','Η Άλκηστις του Ευριπίδη παρουσιάζεται από το Εθνικό Θέατρο στο Αρχαίο Θέατρο Επιδαύρου, σε σκηνοθεσία Δημήτρη Καραντζά. Μια σύγχρονη παραβολή με πολιτικό πρόσημο, ανάμεσα στη ζωή και τον θάνατο, στην τραγωδία και την απροσδόκητη κωμικότητα.',100,'12+','/uploads/1777534459333-386103989.jpg','/uploads/1777534493500-255945480.jpg',NULL,'2026-04-19 14:13:59','Η Άλκηστις κινείται ανάμεσα στο πένθος, την αυτοθυσία, τη ζωή και τον θάνατο. Η σύγχρονη σκηνική ανάγνωση φωτίζει το έργο ως πολιτική και υπαρξιακή παραβολή.','Η διανομή ακολουθεί την επίσημη παραγωγή του Εθνικού Θεάτρου.','Συγγραφέας: Ευριπίδης\nΣκηνοθεσία: Δημήτρης Καραντζάς\nΠαραγωγή: Εθνικό Θέατρο\nΧώρος παρουσίασης: Αρχαίο Θέατρο Επιδαύρου\nΠηγή στοιχείων: Φεστιβάλ Αθηνών Επιδαύρου','Ευριπίδης στην Επίδαυρο\nΣκηνοθεσία Δημήτρη Καραντζά\nΣύγχρονη παραβολή με πολιτικό πρόσημο\nΘέματα ζωής, θανάτου και αυτοθυσίας','Κατάλληλη για κοινό που αγαπά την αρχαία τραγωδία, τις σύγχρονες σκηνοθετικές αναγνώσεις και τις παραστάσεις με υπαρξιακό και πολιτικό βάθος.','Θεματικές θανάτου και πένθους\nΑναφορές σε αυτοθυσία\nΈντονη συναισθηματική φόρτιση');
INSERT INTO `shows` VALUES (13,7,'Βάκχες','Τραγωδία','Οι Βάκχες του Ευριπίδη παρουσιάζονται στο Φεστιβάλ Αθηνών Επιδαύρου 2026 σε σκηνοθεσία Javor Gardev, με τη συμμετοχή των The Tiger Lillies. Μια παράσταση για τη σύγκρουση του διονυσιακού με το απολλώνιο, της έκστασης με τον έλεγχο.',120,'15+','/uploads/1777534542450-669442359.jpg','/uploads/1777534564538-418182434.jpg',NULL,'2026-04-19 14:13:59','Μια τελετουργική και σκοτεινή προσέγγιση του Ευριπίδη, με κέντρο τον Διόνυσο, τη μέθη, τη βία, την έκσταση και την κατάρρευση της τάξης.','Η διανομή ακολουθεί την επίσημη παραγωγή του Φεστιβάλ Αθηνών Επιδαύρου.','Συγγραφέας: Ευριπίδης\nΣκηνοθεσία: Javor Gardev\nΜουσική συμμετοχή: The Tiger Lillies\nΧώρος παρουσίασης: Αρχαίο Θέατρο Επιδαύρου\nΠηγή στοιχείων: Φεστιβάλ Αθηνών Επιδαύρου','Βάκχες στην Επίδαυρο\nΣκηνοθεσία Javor Gardev\nΣυμμετοχή The Tiger Lillies\nΣκοτεινή τελετουργική ατμόσφαιρα','Κατάλληλη για θεατές που αγαπούν την αρχαία τραγωδία, τις διεθνείς σκηνοθετικές προσεγγίσεις και τις μουσικά έντονες παραστάσεις.','Θεματικές βίας και έκστασης\nΣκοτεινή τελετουργική ατμόσφαιρα\nΚατάλληλο για θεατές άνω των 15 ετών');
INSERT INTO `shows` VALUES (14,7,'Ειρήνη','Κωμωδία','Μια επίσκεψη στο έργο του Αριστοφάνη, στο πλαίσιο του Φεστιβάλ Αθηνών Επιδαύρου 2026. Η παράσταση συνομιλεί με την έννοια της ειρήνης μέσα σε έναν κόσμο εξαντλημένο από συγκρούσεις, φόβο και πολιτική φθορά.',100,'12+','/uploads/1777534109290-599445866.jpg','/uploads/1777534141838-820743392.jpg',NULL,'2026-04-19 14:13:59','Μια σύγχρονη επίσκεψη στον Αριστοφάνη, όπου η ειρήνη δεν είναι απλώς ιδέα αλλά αγωνιώδης ανάγκη. Το έργο ανοίγει χώρο για χιούμορ, πολιτικό σχόλιο και ποιητική σκηνική γλώσσα.','Η διανομή ακολουθεί την επίσημη παραγωγή του Φεστιβάλ Αθηνών Επιδαύρου.','Βασισμένο στο έργο του Αριστοφάνη\nΣκηνοθετική προσέγγιση: σύγχρονη επίσκεψη στο αριστοφανικό υλικό\nΠηγή στοιχείων: Φεστιβάλ Αθηνών Επιδαύρου','Αριστοφανικό υλικό σε σύγχρονη ανάγνωση\nΠολιτικό και ποιητικό σχόλιο\nΘέμα ειρήνης και συλλογικής επιβίωσης\nΠαραγωγή Φεστιβάλ Αθηνών Επιδαύρου 2026','Κατάλληλη για θεατές που αγαπούν την πολιτική κωμωδία, τον Αριστοφάνη και τις σύγχρονες σκηνικές αναγνώσεις κλασικών κειμένων.','Πολιτική σάτιρα\nΘεματικές πολέμου και ειρήνης\nΉπια κωμική ένταση');
INSERT INTO `shows` VALUES (15,3,'Ίων','Τραγωδία','Ο Ίων του Ευριπίδη παρουσιάζεται στο πλαίσιο του Φεστιβάλ Αθηνών Επιδαύρου 2026 σε σκηνοθεσία Θωμά Μοσχόπουλου. Ένα από τα πιο αινιγματικά έργα του αρχαίου δράματος, γύρω από την ταυτότητα, την καταγωγή, τη μνήμη και την αποκάλυψη.',110,'12+','/uploads/1777534773613-532514724.jpeg','/uploads/1777534797403-807856578.jpg',NULL,'2026-04-19 14:13:59','Ένα αινιγματικό έργο του Ευριπίδη για την αναζήτηση της καταγωγής, την προσωπική ταυτότητα και τη στιγμή που η αλήθεια διαλύει τις βεβαιότητες.','Η διανομή ακολουθεί την επίσημη παραγωγή.','Συγγραφέας: Ευριπίδης\nΣκηνοθεσία: Θωμάς Μοσχόπουλος\nΠηγή στοιχείων: more.com και Φεστιβάλ Αθηνών Επιδαύρου','Σπάνια παρουσιαζόμενο έργο του Ευριπίδη\nΣκηνοθεσία Θωμά Μοσχόπουλου\nΘέματα ταυτότητας και καταγωγής\nΑρχαίο δράμα με έντονο αίνιγμα','Κατάλληλη για θεατές που αγαπούν το αρχαίο δράμα, τα έργα μυστηρίου και τις ιστορίες γύρω από την αναζήτηση της ταυτότητας.','Θεματικές εγκατάλειψης και ταυτότητας\nΟικογενειακές αποκαλύψεις\nΔραματική ένταση');
INSERT INTO `shows` VALUES (16,8,'ΜΑΚΒΕΘ','Δράμα','Η νέα θεατρική πρόταση του Παναγιώτη Εξαρχέα πάνω στον Μάκβεθ του Σαίξπηρ παρουσιάζεται με σκοτεινή ενέργεια, πολιτική βία και ψυχολογική κατάρρευση. Μια συμπυκνωμένη σκηνική εκδοχή διάρκειας περίπου 90 λεπτών.',90,'15+','/uploads/1777534871457-99359822.jpg','/uploads/1777534913697-759279215.jpeg',NULL,'2026-04-19 14:13:59','Ο Μάκβεθ γίνεται μια σκηνική μελέτη πάνω στη φιλοδοξία, την εξουσία, τη βία και την ψυχολογική αποσύνθεση ενός ανθρώπου που δεν μπορεί να σταματήσει την πτώση του.','Η διανομή ακολουθεί την επίσημη παραγωγή.','Βασισμένο στον Μάκβεθ του Ουίλιαμ Σαίξπηρ\nΣκηνοθετική πρόταση: Παναγιώτης Εξαρχέας\nΠηγή στοιχείων: more.com','Σκοτεινή σαιξπηρική ιστορία\nΔιάρκεια 90 λεπτά\nΚατάλληλο για άνω των 15 ετών\nΘέματα εξουσίας, αίματος και ενοχής','Κατάλληλη για θεατές που αγαπούν τον Σαίξπηρ, το σκοτεινό ψυχολογικό δράμα και τις σύγχρονες συμπυκνωμένες σκηνικές διασκευές.','Βία και φόνος\nΨυχολογική κατάρρευση\nΣκοτεινή ατμόσφαιρα\nΚατάλληλο για θεατές άνω των 15 ετών');
INSERT INTO `shows` VALUES (17,8,'Optansia & Guerrilla','Performance','Μια σύγχρονη παράσταση με τους Βασίλη Ζαφειρόπουλο, Σπύρο Σουρβίνο, Παναγιώτη Τζαφέρη και Δανάη Αναστασία Γεωργούλα. Ένα δίπτυχο σκηνικής δράσης με διάρκεια περίπου 70 λεπτά.',70,'12+','/uploads/1777534395556-50353992.jpg','/uploads/1777534425881-436685668.webp',NULL,'2026-04-19 14:13:59','Μια σύγχρονη σκηνική πρόταση που κινείται ανάμεσα στην performance και στο θέατρο, με έμφαση στο σώμα, στη δράση και στην ένταση της ζωντανής παρουσίας.','Βασίλης Ζαφειρόπουλος\nΣπύρος Σουρβίνος\nΠαναγιώτης Τζαφέρης\nΔανάη Αναστασία Γεωργούλα','Σκηνική παραγωγή: Optansia & Guerrilla\nΠηγή στοιχείων: more.com','Σύγχρονη σκηνική φόρμα\nΔιάρκεια 70 λεπτά\nΜικρό ensemble τεσσάρων ερμηνευτών\nΚατάλληλο για κοινό που αναζητά σύγχρονη performance','Κατάλληλη για θεατές που ενδιαφέρονται για σύγχρονο θέατρο, performance και πιο πειραματικές σκηνικές φόρμες.','Πειραματική σκηνική γλώσσα\nΣωματική ένταση\nΣύγχρονη performance');
INSERT INTO `shows` VALUES (18,2,'Lemon','Μουσική παράσταση','Το Lemon συνεχίζει την περιοδεία του για την περίοδο 2026-2027. Μια μουσικοθεατρική ιστορία εμπνευσμένη από τον κόσμο του Αλεσσάντρο Μπαρίκο και τον θρυλικό πιανίστα 1900, γεμάτη θάλασσα, μνήμη, μουσική και αφήγηση.',80,'10+','/uploads/1777534311167-407634622.jpeg','/uploads/1777534344674-505586033.jpg',NULL,'2026-04-19 14:13:59','Μια μουσικοθεατρική παράσταση δρόμου και περιοδείας, με άξονα τη δύναμη της αφήγησης, της μουσικής και της φαντασίας. Το Lemon ταξιδεύει σαν μικρό θέατρο που ανοίγει χώρο για όνειρο.','Η διανομή ακολουθεί την επίσημη περιοδεία της παραγωγής Lemon.','Παραγωγή: Lemon Περιοδεία 2026-2027\nΠηγή στοιχείων: more.com','Μουσικοθεατρική παράσταση περιοδείας\nΑτμόσφαιρα θάλασσας, μνήμης και αφήγησης\nΚατάλληλο για ευρύ κοινό\nΙδανικό για θεατές που αγαπούν μικρές ποιητικές παραγωγές','Κατάλληλη για θεατές που αγαπούν τις μουσικοθεατρικές αφηγήσεις, τις ταξιδιάρικες ιστορίες και τις παραστάσεις με ποιητική ατμόσφαιρα.','Ήπιο περιεχόμενο\nΠοιητική και νοσταλγική ατμόσφαιρα\nΚατάλληλο για ευρύ κοινό');
INSERT INTO `shows` VALUES (19,4,'Η Αυλή των Θαυμάτων','Δράμα','Το εμβληματικό έργο του Ιάκωβου Καμπανέλλη επιστρέφει στη σκηνή. Μια νεοελληνική ιστορία γειτονιάς, ανθρώπων, ονείρων και κοινωνικών αντιθέσεων, που παραμένει διαχρονική και αναγνωρίσιμη.',100,'12+','/uploads/1777534659815-789708499.jpg','/uploads/1777534699220-179699642.jpg',NULL,'2026-04-19 14:13:59','Μια παράσταση για τη λαϊκή μνήμη, την ελληνική γειτονιά, τα όνειρα των απλών ανθρώπων και την κοινωνική πραγματικότητα που διαμορφώνει τις ζωές τους.','Η διανομή ακολουθεί την επίσημη παραγωγή.','Συγγραφέας: Ιάκωβος Καμπανέλλης\nΠηγή στοιχείων: more.com','Κλασικό νεοελληνικό έργο\nΔιάρκεια περίπου 100 λεπτά\nΙστορία γειτονιάς και κοινωνικής μνήμης\nΙδανικό για κοινό που αγαπά το ελληνικό θέατρο','Κατάλληλη για θεατές που αγαπούν το νεοελληνικό ρεπερτόριο, τις κοινωνικές ιστορίες και τα έργα που αποτυπώνουν τη συλλογική μνήμη.','Κοινωνικές συγκρούσεις\nΘεματικές φτώχειας και προσδοκίας\nΣυναισθηματική φόρτιση');
/*!40000 ALTER TABLE `shows` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `showtimes`
--

DROP TABLE IF EXISTS `showtimes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `showtimes` (
  `showtime_id` int NOT NULL AUTO_INCREMENT,
  `show_id` int NOT NULL,
  `hall_name` varchar(80) NOT NULL,
  `start_time` datetime NOT NULL,
  `base_price` decimal(8,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`showtime_id`),
  KEY `fk_showtimes_show` (`show_id`),
  CONSTRAINT `fk_showtimes_show` FOREIGN KEY (`show_id`) REFERENCES `shows` (`show_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=58 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `showtimes`
--

LOCK TABLES `showtimes` WRITE;
/*!40000 ALTER TABLE `showtimes` DISABLE KEYS */;
INSERT INTO `showtimes` VALUES (1,1,'Κεντρική Σκηνή','2026-05-21 20:00:00',20.00,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (2,1,'Κεντρική Σκηνή','2026-05-24 21:15:00',20.90,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (3,1,'Κεντρική Σκηνή','2026-05-27 20:00:00',18.80,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (4,2,'Κεντρική Σκηνή','2026-05-22 20:00:00',21.50,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (5,2,'Κεντρική Σκηνή','2026-05-25 21:15:00',22.30,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (6,2,'Κεντρική Σκηνή','2026-05-28 19:00:00',20.60,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (7,3,'Grand Hall','2026-05-23 20:00:00',23.00,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (8,3,'Grand Hall','2026-05-26 21:15:00',23.70,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (9,3,'Grand Hall','2026-05-29 20:00:00',22.40,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (10,4,'Grand Hall','2026-05-24 20:00:00',24.50,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (11,4,'Grand Hall','2026-05-27 21:15:00',25.10,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (12,4,'Grand Hall','2026-05-30 19:00:00',17.00,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (13,5,'Olympia Stage','2026-05-25 20:00:00',18.50,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (14,5,'Olympia Stage','2026-05-28 21:15:00',26.50,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (15,5,'Olympia Stage','2026-05-31 20:00:00',18.80,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (16,6,'Olympia Stage','2026-05-26 20:00:00',20.00,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (17,6,'Olympia Stage','2026-05-29 21:15:00',19.50,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (18,6,'Olympia Stage','2026-06-01 20:00:00',20.60,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (19,7,'North Stage','2026-05-27 20:00:00',21.50,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (20,7,'North Stage','2026-05-30 21:15:00',20.90,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (21,7,'North Stage','2026-06-02 20:00:00',22.40,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (22,8,'North Stage','2026-05-28 20:00:00',23.00,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (23,8,'North Stage','2026-05-31 21:15:00',22.30,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (24,8,'North Stage','2026-06-03 17:30:00',17.00,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (25,9,'Open Air Main','2026-05-29 20:00:00',24.50,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (26,9,'Open Air Main','2026-06-01 21:15:00',23.70,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (27,9,'Open Air Main','2026-06-04 20:00:00',18.80,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (28,10,'Open Air Main','2026-05-30 20:00:00',18.50,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (29,10,'Open Air Main','2026-06-02 21:15:00',25.10,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (30,10,'Open Air Main','2026-06-05 20:00:00',20.60,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (31,11,'Black Box A','2026-05-31 20:00:00',20.00,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (32,11,'Black Box A','2026-06-03 21:15:00',26.50,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (33,11,'Black Box A','2026-06-06 20:00:00',22.40,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (34,12,'Black Box A','2026-06-01 20:00:00',21.50,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (35,12,'Black Box A','2026-06-04 21:15:00',19.50,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (36,12,'Black Box A','2026-06-07 20:00:00',17.00,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (37,13,'Riviera Main Stage','2026-06-02 20:00:00',23.00,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (38,13,'Riviera Main Stage','2026-06-05 21:15:00',20.90,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (39,13,'Riviera Main Stage','2026-06-08 19:00:00',18.80,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (40,14,'Riviera Main Stage','2026-06-03 20:00:00',24.50,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (41,14,'Riviera Main Stage','2026-06-06 21:15:00',22.30,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (42,14,'Riviera Main Stage','2026-06-09 19:00:00',20.60,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (43,15,'Olympia Stage','2026-06-04 20:00:00',18.50,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (44,15,'Olympia Stage','2026-06-07 21:15:00',23.70,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (45,15,'Olympia Stage','2026-06-10 20:00:00',22.40,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (46,16,'Family Hall','2026-06-05 20:00:00',20.00,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (47,16,'Family Hall','2026-06-08 21:15:00',25.10,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (48,16,'Family Hall','2026-06-11 19:00:00',17.00,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (49,17,'Family Hall','2026-06-06 20:00:00',21.50,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (50,17,'Family Hall','2026-06-09 21:15:00',26.50,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (51,17,'Family Hall','2026-06-12 19:00:00',18.80,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (52,18,'Grand Hall','2026-06-07 20:00:00',23.00,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (53,18,'Grand Hall','2026-06-10 21:15:00',19.50,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (54,18,'Grand Hall','2026-06-13 20:00:00',20.60,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (55,19,'North Stage','2026-06-08 20:00:00',24.50,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (56,19,'North Stage','2026-06-11 21:15:00',20.90,'2026-04-19 14:13:59');
INSERT INTO `showtimes` VALUES (57,19,'North Stage','2026-06-14 20:00:00',22.40,'2026-04-19 14:13:59');
/*!40000 ALTER TABLE `showtimes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `theatres`
--

DROP TABLE IF EXISTS `theatres`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `theatres` (
  `theatre_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `location` varchar(150) NOT NULL,
  `description` text,
  `avatar_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `intro_text` text,
  `space_overview` text,
  `booking_info` text,
  PRIMARY KEY (`theatre_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `theatres`
--

LOCK TABLES `theatres` WRITE;
/*!40000 ALTER TABLE `theatres` DISABLE KEYS */;
INSERT INTO `theatres` VALUES (1,'Θέατρο Παλλάς','Αθήνα','Ιστορικός θεατρικός χώρος στο κέντρο της Αθήνας με μεγάλες παραγωγές, μιούζικαλ και κλασικό ρεπερτόριο.','/uploads/1779787760323-613832944.jpg','2026-04-19 14:13:59','','','');
INSERT INTO `theatres` VALUES (2,'Δημοτικό Θέατρο Πειραιά','Πειραιάς','Εμβληματικό νεοκλασικό θέατρο με μεγάλες κεντρικές παραγωγές, ανανεωμένο πρόγραμμα και άνετους χώρους υποδοχής.','/uploads/1779787413530-15732342.jpg','2026-04-19 14:13:59','','','');
INSERT INTO `theatres` VALUES (3,'Θέατρο Ολύμπια','Αθήνα','Κλασικός χώρος για δράμα, τραγωδία, μουσικές παραστάσεις και ειδικές εορταστικές παραγωγές.','/uploads/1779787323723-124503384.jpg','2026-04-19 14:13:59','','','');
INSERT INTO `theatres` VALUES (4,'Northern Lights Theatre','Θεσσαλονίκη','Σύγχρονη αίθουσα με premium καθίσματα, family-friendly παραστάσεις και βραδινές παραγωγές υψηλής αισθητικής.','/uploads/1779787239807-413191990.png','2026-04-19 14:13:59','','','');
INSERT INTO `theatres` VALUES (5,'Open Air Drama Arena','Πάτρα','Ανοιχτό θέατρο για καλοκαιρινές παραστάσεις, αρχαίο δράμα και μεγάλες ensemble παραγωγές.','/uploads/1779787635312-844374544.jpg','2026-04-19 14:13:59','','','');
INSERT INTO `theatres` VALUES (6,'Metropolitan Black Box','Αθήνα','Πειραματική σκηνή για σύγχρονα έργα, νέους δημιουργούς και intimate εμπειρία θεατή.','/uploads/1779787531930-427008559.jpeg','2026-04-19 14:13:59','','','');
INSERT INTO `theatres` VALUES (7,'Grand Riviera Stage','Θεσσαλονίκη','Μεγάλη κεντρική σκηνή για μιούζικαλ και λαμπερές παραγωγές με εντυπωσιακά τεχνικά μέσα.','/uploads/1779787589259-719167213.jpeg','2026-04-19 14:13:59','dokimi test','dokimi test','dokimi test');
INSERT INTO `theatres` VALUES (8,'Little Orchard Theatre','Ηράκλειο','Ζεστός θεατρικός χώρος με έμφαση σε οικογενειακές παραστάσεις, ελληνικό έργο και πολιτιστικές δράσεις.','/uploads/1779787458598-14976036.jpg','2026-04-19 14:13:59','','','');
/*!40000 ALTER TABLE `theatres` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('user','admin') NOT NULL DEFAULT 'user',
  `phone` varchar(40) DEFAULT NULL,
  `avatar_url` varchar(500) DEFAULT NULL,
  `bio` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Admin User','admin@theatreapp.com','$2a$10$xlbWDZNfC04qYeNG.XWUae3wnpvaANHKMh0bFCfoDNSOmp91OMXXW','admin',NULL,'/uploads/1776791112963-75635900.png',NULL,'2026-04-19 14:13:59');
INSERT INTO `users` VALUES (2,'Anastasis D','periergos122@gmail.com','$2a$10$Ih0NutOL5pZYm1ST.BALDukTliIy1C1X.Fh2UAnC5OvL0XYXUaoAK','user','6900000000','/uploads/1779790057406-758207906.webp','τεστ','2026-04-19 15:09:25');
INSERT INTO `users` VALUES (3,'Test test','test@gmail.com','$2a$10$bYIvPds.jqPRoKZR6KSUW.ASyawF1atu9I/2YlOH.b5FML3YzR9aS','user',NULL,'/uploads/1776791090749-143056718.png',NULL,'2026-04-19 15:18:13');
INSERT INTO `users` VALUES (4,'dokimi dokimi','dokimi4@gmail.com','$2a$10$.pzGIFy600BujkOSGFUtPevQ.mMDRwUshY21J1zTm4h7hj/jcuptq','user','6900000000','/uploads/1779701617053-375481982.png','eeee','2026-05-25 09:10:26');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'theatre_booking'
--

--
-- Dumping routines for database 'theatre_booking'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-28 14:56:55
