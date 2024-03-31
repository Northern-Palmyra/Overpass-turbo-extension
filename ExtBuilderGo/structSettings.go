package main

type structSettings struct {
	Name        string `json:"name"`
	ShortName   string `json:"short_name"`
	Description string `json:"description"`
	Author      string `json:"author"`
	Version     string `json:"version"`
	VersionName string `json:"version_name"`
	HomepageUrl string `json:"homepage_url"`
}
