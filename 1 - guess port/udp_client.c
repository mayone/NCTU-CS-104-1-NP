#include <stdio.h>	// printf()
#include <stdlib.h>	// atoi(), exit()
#include <string.h>	// memset(), bzero()
#include <unistd.h>	// read(), write()
#include <netdb.h>	// gethostbyname()
//#include <sys/socket.h>
//#include <netinet/in.h>	// struct sockaddr_in
#include <arpa/inet.h>	// struct sockaddr_in, inet_addr, inet_pton

#define BUFLEN 1024
#define TCP_SOCK SOCK_STREAM
#define UDP_SOCK SOCK_DGRAM
#define MIN_PORT 3000
#define MAX_PORT 60000
#define EVER ;;

int socketInit(const char *hostname, unsigned short port);

int main(int argc, char const *argv[])
{
	int sockfd;

	int recv_len;
	char recv_buf[BUFLEN];
	char send_buf[BUFLEN];

	int num_guesses = 0;
	unsigned short port_upper = MAX_PORT;
	unsigned short port_lower = MIN_PORT;
	unsigned short port_guess = (port_lower + port_upper) >> 1;
	char guess_result[100];

	if (argc != 3) {
		printf("Usage: %s <hostname> <port>\n", argv[0]);
		exit(EXIT_FAILURE);
	}

	sockfd = socketInit(argv[1], atoi(argv[2]));

	// Clear buffers
	memset(send_buf, 0, sizeof(send_buf));
	memset(recv_buf, 0, sizeof(recv_buf));

	// Guess port number of server using binary search
	for(EVER) {
		// Send guess
		printf("#%d\n", ++num_guesses);
		sprintf(send_buf, "{\"guess\" : %d}", port_guess);
		printf("send %s\n", send_buf);
		write(sockfd, send_buf, strlen(send_buf));

		// Receive result
		recv_len = read(sockfd, recv_buf, sizeof(recv_buf));
		if (recv_len == 0) {
			printf("Server close the connection\n");
			exit(EXIT_SUCCESS);
		}
		else if (recv_len < 0) {
			printf("ERROR: Read from the server error\n");
			exit(EXIT_FAILURE);
		}
		else {
			printf("receive %s\n", recv_buf);
			sscanf(recv_buf, "{\"result\" : \"%s\"}", guess_result);
			for(int i = 0; i < strlen(guess_result); i++) {
				if (guess_result[i] == '"') {
					guess_result[i] = '\0';
					break;
				}
			}
			if (!strcmp(guess_result, "larger")) {
				port_lower = port_guess + 1;
				port_guess = (port_lower + port_upper) >> 1;
			}
			else if (!strcmp(guess_result, "smaller")) {
				port_upper = port_guess - 1;
				port_guess = (port_lower + port_upper) >> 1;
			}
			else if (!strcmp(guess_result, "bingo!")) {
				break;
			}
			else
				exit(EXIT_FAILURE);
		}
	}

	close(sockfd);

	socketInit(argv[1], port_guess);

	printf("#%d\n", ++num_guesses);
	sprintf(send_buf, "{\"student_id\" : \"%s\"}", "0116209");
	printf("send %s\n", send_buf);
	write(sockfd, send_buf, strlen(send_buf));
	recv_len = read(sockfd, recv_buf, sizeof(recv_buf));
	if (recv_len == 0) {
		printf("Server close the connection\n");
		exit(EXIT_SUCCESS);
	}
	else if (recv_len < 0) {
		printf("ERROR: Read from the server error\n");
		exit(EXIT_FAILURE);
	}
	else {
		printf("receive %s\n", recv_buf);
		sscanf(recv_buf, "{\"result\" : \"%s\"}", guess_result);
	}

	return 0;
}

int socketInit(const char *hostname, unsigned short port)
{
	int sockfd;
	struct sockaddr_in servaddr;
	struct hostent *host;

	// Initialize sockaddr
	memset(&servaddr, 0, sizeof(servaddr));

	// Family domain
	servaddr.sin_family = PF_INET;
	// IP address
	host = gethostbyname(hostname);
	if (host == NULL) {
		printf("ERROR: Get host by name error\n");
		exit(EXIT_FAILURE);
	}
	memcpy(&servaddr.sin_addr, host->h_addr, host->h_length);
	// Port number
	servaddr.sin_port = htons(port);

	// Create socket
	if ((sockfd = socket(AF_INET, UDP_SOCK, 0)) < 0) {
		printf("ERROR: Create socket error\n");
		exit(EXIT_FAILURE);
	}

	// Connect to the server specified in the servaddr
	if (connect(sockfd, (struct sockaddr*)&servaddr, sizeof(servaddr)) < 0)	{
		printf("ERROR: Connect to the server error\n");
		exit(EXIT_FAILURE);
	}

	return sockfd;
}