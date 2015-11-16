#include <iostream>
#include <cstdlib>
#include <string>
#include <pthread.h>
#include "Map.h"

using namespace std;

const int num_threads = 4;

class ThreadData { 
public:
	int threadID;
	int *score;
	Map::Field *minerField;
};

void *miner(void *threadData);

int main(int argc, char const *argv[])
{
	int score[4];
	int max_score = -1;
	int num_max;
	Map map;
	string mapName;
	pthread_t* threads;
	ThreadData* threadData;

	threads = new pthread_t[num_threads];
	threadData = new ThreadData[num_threads];

	if (argc != 2) {
		cout << "Usage: " << argv[0] << " <map_name>" << endl;
		exit(EXIT_FAILURE);
	}
	else {
		mapName = string(argv[1]);
	}

	map.initialize(mapName);
	map.display();

	// Start mining
	for(int i = 0; i < num_threads; i++) {
		threadData[i].threadID = i;
		threadData[i].score= &score[i];
		threadData[i].minerField = &map.minerField[i];

		pthread_create(&threads[i], NULL, miner, (void*)&threadData[i]);	
	}

	// All threads terminated
	for(int i = 0; i < num_threads; i++) {
		pthread_join(threads[i], NULL);
	}

	// Compare scores
	for(int i = 0; i < num_threads; i++) {
		if (max_score < score[i]) {
			max_score = score[i];
			num_max = 1;
		}
		else if (max_score == score[i]) {
			num_max += 1;
		}
	}

	// Output scores and winner(s)
	for(int i = 0; i < num_threads; i++) {
		cout << "Miner#" << i << ": " << score[i];
		if (score[i] == max_score) {
			if (num_max == 1) {
				cout << " (win)";
			}
			else {
				cout << " (draw)";
			}
		}
		cout << endl;
	}

	delete [] threads;
	delete [] threadData;

	return 0;
}

void *miner(void *threadData)
{
	int score = 0;
	ThreadData *tData = static_cast<ThreadData *>(threadData);

	for(int i = 0; i < tData->minerField->fieldSize[1]; i++) {
		for(int j = 0; j < tData->minerField->fieldSize[0]; j++) {
			if (tData->minerField->field[i][j] == '*')
				score += 1;
		}
	}

	*(tData->score) = score;

	pthread_exit(NULL);
}