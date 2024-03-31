# Overpass Turbo StreetView browser extension

Для FireFox: https://addons.mozilla.org/en-GB/firefox/addon/overpass-turbo-streetview/
Для Google Chrome: https://chromewebstore.google.com/detail/overpass-turbo-streetview/pcbflicifmbdhecmpmofnbbgpgjghkec

Расширение дополняет стандартный функционал https://overpass-turbo.eu и https://maps.mail.ru/osm/tools/overpass
После выполнения запроса на карте появляются выделенные области, при клике на которых открывается всплывающее окно. В это окно расширение добавляет ссылки на популярные картографические сервисы с координатами выбранного на карте объекта.

## Директории проекта

### ExtBuilderGo
Директория проекта на языке Go необходимого для сборки расширений под браузеры Chrome и Firefox.

### Builds
В этой папке хранятся билды для загрузки в сторы, выполненные при помощи `./go_build_ExtBuilderGo`.

### Chrome
Распакованное расширение для Chrome хранится в `Chrome/Extension`. Оно собрано в промежуточном этапе при помощи `./go_build_ExtBuilderGo`.

### FireFox
Распакованное расширение для FireFox хранится в `FireFox/Extension`. Оно собрано в промежуточном этапе при помощи `./go_build_ExtBuilderGo`.

### Manifests
Заготовки манифестов для расширений браузеров Chrome и Firefox

### Src
Директория содержащая основные исходники расширения.

### StoreInfo
Директория с изображениями и описанием для сторов.

## Файлы проекта

### settings.json
Файл в котором хранятся имена расширения, текущая версия и другие поля для вставки в Manifests при помощи `./go_build_ExtBuilderGo`.

### go_build_ExtBuilderGo
Бинарный файл скомпилированный из проекта `./ExtBuilderGo/` под MacOS.
Он берет данные из `settings.json`, собирает файлы расширений из директории `./Src/` и `./Manifests/` в директории `./FireFox/` и `./Chrome/`, правит в них манифесты, пакует в zip и кладет в `./Builds/`.

