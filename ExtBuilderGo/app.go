package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

var err error
var path string
var basePath string

func copyFiles(source, destination string) error {

	if _, err := os.Stat(destination); os.IsNotExist(err) {
		err := os.MkdirAll(destination, 0755)
		if err != nil {
			panic(err)
			return err
		}
	}

	err = filepath.Walk(source, func(path string, info os.FileInfo, err error) error {
		var relPath = strings.Replace(path, source, "", 1)
		if relPath == "" {
			return nil
		}
		if info.IsDir() {
			return os.Mkdir(filepath.Join(destination, relPath), 0755)
		} else {
			var data, err1 = os.ReadFile(filepath.Join(source, relPath))
			if err1 != nil {
				return err1
			}
			return os.WriteFile(filepath.Join(destination, relPath), data, 0777)
		}
	})
	return err
}

func makeManifest(settings structSettings, source, destination string) {

	//var logStr = fmt.Sprintf("Making manifest\nSource: %s\nDestination: %s\n", source, destination)
	//_, err := io.WriteString(os.Stdout, logStr)
	//if err != nil {
	//	panic(err)
	//	return
	//}

	manifest, err := os.ReadFile(source)
	if err != nil {
		panic(err)
	}

	// byte to string
	manifestString := string(manifest)

	// replace version
	manifestString = strings.Replace(manifestString, "{{version}}", settings.Version, -1)
	manifestString = strings.Replace(manifestString, "{{version_name}}", settings.VersionName, -1)

	//replace name
	manifestString = strings.Replace(manifestString, "{{name}}", settings.Name, -1)
	manifestString = strings.Replace(manifestString, "{{short_name}}", settings.ShortName, -1)

	// replace description
	manifestString = strings.Replace(manifestString, "{{description}}", settings.Description, -1)

	// replace author
	manifestString = strings.Replace(manifestString, "{{author}}", settings.Author, -1)

	// replace homepage_url
	manifestString = strings.Replace(manifestString, "{{homepage_url}}", settings.HomepageUrl, -1)

	// string to bytes array
	manifestBytes := []byte(manifestString)

	err = os.WriteFile(destination, manifestBytes, 0644)
	if err != nil {
		panic(err)
	}

}

func getSettings(source string) structSettings {

	data, err := os.ReadFile(source)
	if err != nil {
		panic(err)
	}

	var settings = structSettings{}

	err = json.Unmarshal(data, &settings)
	if err != nil {
		fmt.Println(err)
		return settings
	}

	//settingsStr, _ := json.MarshalIndent(settings, "", "  ")
	//fmt.Println(string(settingsStr))

	return settings
}

func getPwdCurrent() string {
	dir, err := os.Getwd()
	if err != nil {
		log.Fatal(err)
	}
	return dir
}

func getPwd() string {
	ex, err := os.Executable()
	if err != nil {
		panic(err)
	}
	exPath := filepath.Dir(ex)
	return exPath
}

func execShell(name string, arg ...string) {
	type output struct {
		out []byte
		err error
	}

	ch := make(chan output)

	//fmt.Printf("Executing shell: %s %s\n", name, strings.Join(arg, " "))

	go func() {
		cmd := exec.Command(name, arg...)
		out, err := cmd.Output()
		//out, err := cmd.CombinedOutput()
		ch <- output{out, err}
	}()

	select {
	case <-time.After(5 * time.Second):
		fmt.Println("timed out")
	case x := <-ch:
		//fmt.Printf("program done; out: %q\n", string(x.out))
		if x.err != nil {
			fmt.Printf("program errored: %s\n", x.err)
		}
	}

}

func removeTrash(source string) {

	execShell("find", source, "-iname", ".DS_*", "-delete")

}

func zipIt(source, destination string) {

	if _, err := os.Stat(destination); err == nil {
		//fmt.Printf("%s already exists.\n", destination)
		//os.Exit(1)
		err := os.Remove(destination)
		if err != nil {
			panic(err)
		}
	}

	app := "zip"

	arg0 := "-r"
	arg1 := destination
	arg2 := source

	cmd := exec.Command(app, arg0, arg1, arg2)
	stdout, err := cmd.Output()

	if err != nil && err.Error() != "exit status 12" {
		fmt.Println(err.Error())
		panic(err)
	}

	// Print the output
	fmt.Println(string(stdout))

}

func clearStorages() {

	// Remove built Chrome Extension
	err := os.RemoveAll(basePath + "/Chrome/Extension")
	if err != nil {
		panic(err)
		return
	}

	// Copy built Firefox Extension
	err = os.RemoveAll(basePath + "/FireFox/Extension")
	if err != nil {
		panic(err)
		return
	}

	removeTrash(basePath + "/Src")
	removeTrash(basePath + "/FireFox")
	removeTrash(basePath + "/Chrome")

}

func buildChrome() {

	settings := getSettings(basePath + "/settings.json")

	// Copy source to Chrome Extension
	err = copyFiles(basePath+"/Src/", basePath+"/Chrome/Extension/")
	if err != nil {
		panic(err)
		return
	}

	makeManifest(settings, basePath+"/Manifests/manifest_chrome.json", basePath+"/Chrome/Extension/manifest.json")

	// Zip Chrome Extension
	err = os.Chdir(basePath + "/Chrome")
	if err != nil {
		panic(err)
		return
	}

	zipIt(".", basePath+"/Builds/Chrome_v"+settings.Version+" "+settings.VersionName+".zip")

	err = os.Chdir(basePath)
	if err != nil {
		panic(err)
		return
	}

}

func buildFirefox() {

	settings := getSettings(basePath + "/settings.json")

	// Copy source to Firefox Extension
	err = copyFiles(basePath+"/Src/", basePath+"/FireFox/Extension/")
	if err != nil {
		panic(err)
		return
	}

	makeManifest(settings, basePath+"/Manifests/manifest_firefox.json", basePath+"/FireFox/Extension/manifest.json")

	// Zip Firefox Extension
	err := os.Chdir(basePath + "/FireFox/Extension")
	if err != nil {
		panic(err)
		return
	}

	zipIt(".", basePath+"/Builds/Firefox_v"+settings.Version+" "+settings.VersionName+".zip")

	err = os.Chdir(basePath)
	if err != nil {
		panic(err)
		return
	}

}

func main() {

	path = getPwd()
	err = os.Chdir(path)
	if err != nil {
		panic(err)
		return
	}
	basePath = getPwdCurrent()

	clearStorages()

	buildChrome()
	buildFirefox()

}
