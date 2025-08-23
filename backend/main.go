package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"golang.org/x/crypto/bcrypt"
)

var db *sql.DB

// enableCORS is now a middleware
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// User struct
type User struct {
	UserID      int       `json:"userID"`
	Username    string    `json:"username"`
	FirstName   string    `json:"firstName"`
	LastName    string    `json:"lastName"`
	Suffix      string    `json:"suffix,omitempty"`
	Email       string    `json:"email"`
	PhoneNumber string    `json:"phoneNumber"`
	Password    string    `json:"password"`
	Role        string    `json:"role"`
	ProfilePic  string    `json:"profilePic,omitempty"`
	CreatedAt   time.Time `json:"createdAt"`
}

// logAndSendError logs an error and sends a JSON error response.
func logAndSendError(w http.ResponseWriter, logMessage, userMessage string, status int) {
	log.Println(logMessage)
	jsonError(w, userMessage, status)
}

// jsonError sends a JSON error response.
func jsonError(w http.ResponseWriter, message string, status int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}

// handleProfilePicUpload handles saving the profile picture.
func handleProfilePicUpload(r *http.Request) (string, error) {
	profileFile, header, err := r.FormFile("profilePic")
	if err != nil {
		if err == http.ErrMissingFile {
			log.Println("No profile picture uploaded.")
			return "", nil // No file uploaded, not an error for us
		}
		return "", fmt.Errorf("failed to get profile picture from form: %w", err)
	}
	defer profileFile.Close()

	os.MkdirAll("uploads", os.ModePerm)
	profileFilename := fmt.Sprintf("%d_%s", time.Now().Unix(), header.Filename)
	dst, err := os.Create(filepath.Join("uploads", profileFilename))
	if err != nil {
		return "", fmt.Errorf("failed to create file for profile picture: %w", err)
	}
	defer dst.Close()

	if _, err := io.Copy(dst, profileFile); err != nil {
		return "", fmt.Errorf("failed to copy profile picture to file: %w", err)
	}

	log.Println("Saved profile picture:", profileFilename)
	return profileFilename, nil
}

// insertUserIntoDB inserts a new user into the database.
func insertUserIntoDB(user User, profilePicFilename string) error {
	_, err := db.Exec(`INSERT INTO cm_users 
		(username, first_name, last_name, suffix, email, phone_number, password, role, profile_pic)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		user.Username, user.FirstName, user.LastName, user.Suffix, user.Email, user.PhoneNumber, user.Password, user.Role, profilePicFilename,
	)
	return err
}

// getUserPasswordByEmail retrieves a user's password by email.
func getUserPasswordByEmail(email string) (string, error) {
	var storedPassword string
	err := db.QueryRow("SELECT password FROM cm_users WHERE email = ?", email).Scan(&storedPassword)
	return storedPassword, err
}

// getUserDetailsByEmail retrieves user details by email.
func getUserDetailsByEmail(email string) (User, error) {
	var user User
	err := db.QueryRow("SELECT username, email, role, profile_pic FROM cm_users WHERE email = ?", email).Scan(
		&user.Username, &user.Email, &user.Role, &user.ProfilePic,
	)
	return user, err
}

// parseAddUserForm parses the multipart form data for addUserHandler.
func parseAddUserForm(r *http.Request) (User, error) {
	var user User
	user.Username = r.FormValue("username")
	user.FirstName = r.FormValue("firstName")
	user.LastName = r.FormValue("lastName")
	user.Suffix = r.FormValue("suffix")
	user.Email = r.FormValue("email")
	user.PhoneNumber = r.FormValue("phoneNumber")
	user.Password = r.FormValue("password")
	user.Role = r.FormValue("role")
	return user, nil
}

// decodeLoginRequest decodes the JSON body for loginHandler.
func decodeLoginRequest(r *http.Request) (User, error) {
	var user User
	err := json.NewDecoder(r.Body).Decode(&user)
	return user, err
}

// Initialize DB connection
func initDB() {
	var err error
	dsn := os.Getenv("DATABASE_DSN")
	if dsn == "" {
		log.Fatal("DATABASE_DSN environment variable not set")
	}
	db, err = sql.Open("mysql", dsn)
	if err != nil {
		log.Fatal("DB connection error:", err)
	}
	if err = db.Ping(); err != nil {
		log.Fatal("DB ping error:", err)
	}
	fmt.Println("✅ Connected to poultry_db successfully")
}

// POST new user with file upload
func addUserHandler(w http.ResponseWriter, r *http.Request) {
	// CORS is now handled by middleware
	// if r.Method == http.MethodOptions {
	// 	w.WriteHeader(http.StatusOK)
	// 	return
	// }
	if r.Method != http.MethodPost {
		jsonError(w, "Only POST allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse multipart form (max 5MB)
	if err := r.ParseMultipartForm(5 << 20); err != nil {
		logAndSendError(w, "Parse form error: "+err.Error(), "Cannot parse form: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Read form values
	user, err := parseAddUserForm(r)
	if err != nil {
		logAndSendError(w, "Form parsing error: "+err.Error(), "Failed to parse user data", http.StatusBadRequest)
		return
	}

	// The log for "Form received" is not an error log, so it remains.
	log.Println("Form received:", user.Username, user.FirstName, user.LastName, user.Email, user.PhoneNumber, user.Role, "suffix:", user.Suffix)

	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		logAndSendError(w, "Password hashing error: "+err.Error(), "Failed to process password", http.StatusInternalServerError)
		return
	}
	user.Password = string(hashedPassword)

	// Handle profile picture file
	profileFilename, err := handleProfilePicUpload(r)
	if err != nil {
		logAndSendError(w, "Profile picture upload error: "+err.Error(), "Failed to upload profile picture: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Insert into DB
	err = insertUserIntoDB(User{
		Username:    user.Username,
		FirstName:   user.FirstName,
		LastName:    user.LastName,
		Suffix:      user.Suffix,
		Email:       user.Email,
		PhoneNumber: user.PhoneNumber,
		Password:    user.Password,
		Role:        user.Role,
	}, profileFilename)
	if err != nil {
		logAndSendError(w, "DB Insert Error: "+err.Error(), "Failed to register user: "+err.Error(), http.StatusInternalServerError)
		return
	}

	log.Println("User inserted successfully:", user.Username)
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "User added successfully!"})
}

// POST login user
func loginHandler(w http.ResponseWriter, r *http.Request) {
	// CORS is now handled by middleware
	// if r.Method == http.MethodOptions {
	// 	w.WriteHeader(http.StatusOK)
	// 	return
	// }
	if r.Method != http.MethodPost {
		jsonError(w, "Only POST method is allowed", http.StatusMethodNotAllowed)
		return
	}

	user, err := decodeLoginRequest(r)
	if err != nil {
		jsonError(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Query the database for the user with the provided email and password
	storedPassword, err := getUserPasswordByEmail(user.Email)

	if err == sql.ErrNoRows {
		jsonError(w, "Invalid email or password", http.StatusUnauthorized)
		return
	} else if err != nil {
		// Redundant log.Println removed, logAndSendError handles logging
		logAndSendError(w, "Database query error: "+err.Error(), "Server error", http.StatusInternalServerError)
		return
	}

	// Compare the provided password with the stored hashed password
	if err = bcrypt.CompareHashAndPassword([]byte(storedPassword), []byte(user.Password)); err != nil {
		jsonError(w, "Invalid email or password", http.StatusUnauthorized)
		return
	}

	// Fetch user details including profile_pic
	user, err = getUserDetailsByEmail(user.Email)
	if err != nil {
		// Redundant log.Println removed, logAndSendError handles logging
		logAndSendError(w, "Database query error: "+err.Error(), "Server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":    "Login successful",
		"username":   user.Username,
		"email":      user.Email,
		"role":       user.Role,
		"profilePic": user.ProfilePic,
	})
}

func main() {
	initDB()
	defer db.Close()

	http.HandleFunc("/adduser", corsMiddleware(http.HandlerFunc(addUserHandler)).ServeHTTP)
	http.HandleFunc("/login", corsMiddleware(http.HandlerFunc(loginHandler)).ServeHTTP)

	// Serve static files from the "uploads" directory
	http.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir("uploads"))))

	fmt.Println("🚀 Server running at http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}