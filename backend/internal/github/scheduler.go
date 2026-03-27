package github

import (
	"context"
	"log"
	"time"

	"github.com/robfig/cron/v3"
)

// StartScheduler registers a cron job that calls ScrapeAll on the given
// schedule and starts the cron runner. The caller should defer c.Stop().
//
// cronExpr follows standard 5-field cron syntax, e.g. "0 */6 * * *" for
// every six hours.
func StartScheduler(scraper *Scraper, cronExpr string) *cron.Cron {
	c := cron.New()

	_, err := c.AddFunc(cronExpr, func() {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()

		n, err := scraper.ScrapeAll(ctx)
		if err != nil {
			log.Printf("scheduler: ScrapeAll error: %v", err)
			return
		}
		log.Printf("scheduler: scrape complete — %d projects updated", n)
	})
	if err != nil {
		// A bad cron expression is a programming error; panic immediately.
		panic("github scheduler: invalid cron expression: " + err.Error())
	}

	c.Start()
	log.Printf("scheduler: started with schedule %q", cronExpr)
	return c
}
