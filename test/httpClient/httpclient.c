#include <stdio.h>
#include <stdlib.h>

#include <curl/curl.h>

void perform_request(char *);

int main() {
	FILE *url_file = fopen("./URLS.txt", "r");

	if (url_file == NULL) {
		exit(EXIT_FAILURE);
	}
	char *line = NULL;
	size_t len = 0;
	ssize_t read;

	while ((read = getline(&line, &len, url_file)) != -1) {
		perform_request(line);
	}
	return 0;
}

void perform_request(char *url) {
	CURL *curl;
	CURLcode res;

	curl = curl_easy_init();
	if (curl) {
		curl_easy_setopt(curl, CURLOPT_URL, url);
	}
	else {
		printf("Init CURL failed\n");
		return;
	}
	res = curl_easy_perform(curl);

	if (res != CURLE_OK) {
		fprintf(stderr, "curl_easy_perform faled: %s\n", curl_easy_strerror(res));
	}

	curl_easy_cleanup(curl);
	printf("\n");
}